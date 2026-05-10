"""
Admin API Router - 360醫療AI大調查
Phase 2: 從 PostgreSQL 讀取資料，JSON fallback 保底
"""
import asyncio
import csv
import io
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, update, desc
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

router = APIRouter(prefix="/api/admin", tags=["admin"])

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_CLINICS_PATH = _DATA_DIR / "clinics_real.json"
_UNLOCKS_PATH = _DATA_DIR / "unlock_records.json"
_BROADCASTS_PATH = _DATA_DIR / "broadcast_records.json"
_CRAWLER_STATUS_PATH = _DATA_DIR / "crawler_status.json"
_SCORING_RULES_PATH = _DATA_DIR / "scoring_rules.json"

_DEFAULT_SCORING_RULES: dict = {
    "legal": {"has_registration": 20, "no_registration": 0},
    "google_stars": {"4.5+": 15, "4.0-4.4": 12, "3.5-3.9": 9, "3.0-3.4": 6, "below_3.0": 3},
    "google_reviews": {"1000+": 5, "500-999": 4, "100-499": 3, "1-99": 2, "0": 0},
    "judicial": {"0_cases": 20, "1_case": 15, "2_cases": 10, "3_cases": 5, "4plus_cases": 0},
}


def _get_session():
    try:
        from config import DATABASE_URL
        from models.clinic import Clinic
        from models.unlock_record import UnlockRecord
        from models.broadcast_record import BroadcastRecord
        from models.crawler_status import CrawlerStatus
        db_url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
        engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
        return async_sessionmaker(engine, expire_on_commit=False), Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus
    except Exception:
        return None, None, None, None, None


def _load_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default if default is not None else []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _now_tw() -> datetime:
    return datetime.now(tz=timezone(timedelta(hours=8)))


def _format_dt(dt) -> str | None:
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    return dt.isoformat()


@router.get("/stats")
async def get_stats():
    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                now = _now_tw()
                today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

                today_unlocks = (await session.execute(
                    select(func.count()).where(UnlockRecord.time >= today_start)
                )).scalar_one()

                total_unlocks = (await session.execute(
                    select(func.count(UnlockRecord.id))
                )).scalar_one()

                line_sent_today = (await session.execute(
                    select(func.count()).where(BroadcastRecord.sent_at >= today_start)
                )).scalar_one()

                crawler_rows = (await session.execute(select(CrawlerStatus))).scalars().all()
                crawler_status = {
                    r.key: {"last_run": _format_dt(r.last_run), "status": r.status}
                    for r in crawler_rows
                }
                for key in ["places", "judicial", "mohw"]:
                    if key not in crawler_status:
                        crawler_status[key] = {"last_run": None, "status": "unknown"}

                return {
                    "today_unlocks": today_unlocks,
                    "total_unlocks": total_unlocks,
                    "line_sent_today": line_sent_today,
                    "crawler_status": crawler_status,
                }
    except Exception as e:
        print(f"[stats] DB error, fallback: {e}")

    unlocks = _load_json(_UNLOCKS_PATH, [])
    broadcasts = _load_json(_BROADCASTS_PATH, [])
    crawler_status = _load_json(_CRAWLER_STATUS_PATH, {
        "places": {"last_run": None, "status": "unknown"},
        "judicial": {"last_run": None, "status": "unknown"},
        "mohw": {"last_run": None, "status": "unknown"},
    })
    now = _now_tw()
    today_str = now.strftime("%Y-%m-%d")
    return {
        "today_unlocks": sum(1 for u in unlocks if u.get("time", "").startswith(today_str)),
        "total_unlocks": len(unlocks),
        "line_sent_today": sum(1 for b in broadcasts if b.get("sent_at", "").startswith(today_str)),
        "crawler_status": crawler_status,
    }


@router.get("/unlocks")
async def get_unlocks(period: str = "all", limit: int = 20, offset: int = 0):
    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                now = _now_tw()
                q = select(UnlockRecord).order_by(desc(UnlockRecord.time))
                if period == "today":
                    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                    q = q.where(UnlockRecord.time >= today_start)
                elif period == "week":
                    week_ago = now - timedelta(days=7)
                    q = q.where(UnlockRecord.time >= week_ago)

                total = (await session.execute(
                    select(func.count()).select_from(q.subquery())
                )).scalar_one()

                rows = (await session.execute(q.offset(offset).limit(limit))).scalars().all()
                unlocks = [
                    {"id": r.id, "time": _format_dt(r.time), "user_id": r.user_id,
                     "target_name": r.target_name, "unlock_type": r.unlock_type}
                    for r in rows
                ]
                return {"total": total, "unlocks": unlocks}
    except Exception as e:
        print(f"[unlocks] DB error, fallback: {e}")

    records = sorted(_load_json(_UNLOCKS_PATH, []), key=lambda x: x.get("time", ""), reverse=True)
    now = _now_tw()
    if period == "today":
        records = [r for r in records if r.get("time", "").startswith(now.strftime("%Y-%m-%d"))]
    elif period == "week":
        week_ago = (now - timedelta(days=7)).isoformat()
        records = [r for r in records if r.get("time", "") >= week_ago]
    total = len(records)
    return {"total": total, "unlocks": records[offset: offset + limit]}


@router.post("/log-unlock")
async def log_unlock(request: Request):
    body = await request.json()
    user_id = body.get("user_id", "")
    target_name = body.get("target_name", "")
    unlock_type = body.get("unlock_type", "clinic")

    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                now = _now_tw()
                record_id = f"ul_{now.strftime('%Y%m%d%H%M%S')}_{user_id[:8]}"
                session.add(UnlockRecord(
                    id=record_id, time=now.replace(tzinfo=None),
                    user_id=user_id, target_name=target_name, unlock_type=unlock_type
                ))
                await session.commit()
                return {"ok": True}
    except Exception as e:
        print(f"[log-unlock] DB error, fallback: {e}")

    records = _load_json(_UNLOCKS_PATH, [])
    records.append({
        "id": f"ul_{len(records)+1:05d}",
        "time": _now_tw().isoformat(),
        "user_id": user_id, "target_name": target_name, "unlock_type": unlock_type,
    })
    _save_json(_UNLOCKS_PATH, records)
    return {"ok": True}


@router.get("/broadcasts")
async def get_broadcasts(limit: int = 50, offset: int = 0):
    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                total = (await session.execute(select(func.count(BroadcastRecord.id)))).scalar_one()
                rows = (await session.execute(
                    select(BroadcastRecord).order_by(desc(BroadcastRecord.sent_at)).offset(offset).limit(limit)
                )).scalars().all()
                broadcasts = [
                    {"id": r.id, "sent_at": _format_dt(r.sent_at), "user_id": r.user_id,
                     "message_type": r.message_type, "target_name": r.target_name, "status": r.status}
                    for r in rows
                ]
                return {"total": total, "broadcasts": broadcasts}
    except Exception as e:
        print(f"[broadcasts] DB error, fallback: {e}")

    records = sorted(_load_json(_BROADCASTS_PATH, []), key=lambda x: x.get("sent_at", ""), reverse=True)
    return {"total": len(records), "broadcasts": records[offset: offset + limit]}


@router.put("/clinics/{clinic_id}")
async def update_clinic(clinic_id: str, request: Request):
    body = await request.json()
    custom_note = body.get("custom_note", "")

    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                await session.execute(
                    update(Clinic).where(Clinic.id == clinic_id).values(custom_note=custom_note)
                )
                await session.commit()
                return {"ok": True}
    except Exception as e:
        print(f"[update_clinic] DB error, fallback: {e}")

    clinics = _load_json(_CLINICS_PATH, [])
    for c in clinics:
        if c.get("id") == clinic_id:
            c["custom_note"] = custom_note
            break
    _save_json(_CLINICS_PATH, clinics)
    return {"ok": True}


@router.get("/partners")
async def get_partners():
    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                rows = (await session.execute(
                    select(Clinic).where(Clinic.is_partner == True).order_by(Clinic.name)
                )).scalars().all()
                return {"partners": [
                    {
                        "id": r.id, "name": r.name, "address": r.address,
                        "phone": r.phone, "specialty": r.specialty,
                        "is_partner": r.is_partner,
                        "google_rating": r.google_rating,
                        "score": r.score,
                        "created_at": _format_dt(r.created_at),
                    }
                    for r in rows
                ]}
    except Exception as e:
        print(f"[partners] DB error, fallback: {e}")

    clinics = _load_json(_CLINICS_PATH, [])
    partners = [c for c in clinics if c.get("isPartner") or c.get("is_partner")]
    return {"partners": [
        {
            "id": c.get("id"), "name": c.get("name"), "address": c.get("address"),
            "phone": c.get("phone"), "specialty": c.get("specialty"),
            "is_partner": True,
            "google_rating": c.get("google_rating"),
            "score": c.get("score"),
            "created_at": None,
        }
        for c in partners
    ]}


@router.patch("/partners/{clinic_id}/toggle")
async def toggle_partner(clinic_id: str):
    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                r = await session.get(Clinic, clinic_id)
                if not r:
                    raise HTTPException(status_code=404, detail="Clinic not found")
                r.is_partner = not r.is_partner
                r.updated_at = _now_tw().replace(tzinfo=None)
                await session.commit()
                return {"ok": True, "is_partner": r.is_partner}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[toggle_partner] DB error, fallback: {e}")

    clinics = _load_json(_CLINICS_PATH, [])
    for c in clinics:
        if c.get("id") == clinic_id:
            c["isPartner"] = not c.get("isPartner", False)
            _save_json(_CLINICS_PATH, clinics)
            return {"ok": True, "is_partner": c["isPartner"]}
    raise HTTPException(status_code=404, detail="Clinic not found")


@router.post("/send-test")
async def send_test(request: Request):
    from config import LINE_CHANNEL_ACCESS_TOKEN
    import httpx

    body = await request.json()
    user_id = body.get("user_id", "")
    message_type = body.get("message_type", "clinic")
    clinic_id = body.get("clinic_id", "")
    custom_text = body.get("text", "")

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    if message_type == "custom":
        if not custom_text:
            raise HTTPException(status_code=400, detail="text required")
        messages = [{"type": "text", "text": custom_text}]
    elif message_type == "clinic":
        from services.recommend import get_clinic_by_id
        from services.report import build_clinic_flex_report
        clinic = get_clinic_by_id(clinic_id)
        if not clinic:
            raise HTTPException(status_code=404, detail="Clinic not found")
        flex = build_clinic_flex_report(clinic)
        messages = [{"type": "flex", "altText": f"{clinic['name']} 評鑑報告", "contents": flex}]
    elif message_type == "doctor":
        messages = [{"type": "text", "text": "您查詢的醫師報告已解鎖，請至LINE查看完整評鑑資訊。"}]
    else:
        raise HTTPException(status_code=400, detail="Invalid message_type")

    if not LINE_CHANNEL_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="LINE not configured")

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.line.me/v2/bot/message/push",
            headers={"Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}", "Content-Type": "application/json"},
            json={"to": user_id, "messages": messages},
            timeout=10.0,
        )
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"LINE push failed: {r.text}")

    clinic_name = ""
    if message_type == "clinic" and clinic_id:
        from services.recommend import get_clinic_by_id
        c = get_clinic_by_id(clinic_id)
        clinic_name = c["name"] if c else clinic_id

    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                now = _now_tw()
                record_id = f"bc_{now.strftime('%Y%m%d%H%M%S')}_{user_id[:8]}"
                session.add(BroadcastRecord(
                    id=record_id, sent_at=now, user_id=user_id,
                    message_type=message_type,
                    target_name=clinic_name or custom_text[:20],
                    status="success"
                ))
                await session.commit()
    except Exception as e:
        print(f"[send-test] DB error: {e}")
        records = _load_json(_BROADCASTS_PATH, [])
        records.append({"id": f"bc_{len(records)+1:05d}", "sent_at": _now_tw().isoformat(),
                        "user_id": user_id, "message_type": message_type,
                        "target_name": clinic_name or custom_text[:20], "status": "success"})
        _save_json(_BROADCASTS_PATH, records)

    return {"ok": True}


@router.post("/clinics/sync-google-photos")
async def sync_google_photos(batch_size: int = 30):
    """同步診所的 Google Places 店面照片（一次處理 N 筆，~60s）"""
    from crawlers.places_photos import sync_clinic_photos
    stats = await sync_clinic_photos(batch_size=min(batch_size, 50))
    return {"ok": True, "stats": stats,
            "message": f"處理 {stats['processed']} 筆 → 抓到 {stats['got_photo']} 張照片"}


@router.post("/clinics/recalc-scores")
async def recalc_scores():
    """重新計算所有診所的 score 欄位（用最新 rating/score 子欄位）"""
    from sqlalchemy import text as sql_text
    from database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        result = await session.execute(sql_text("""
            UPDATE clinics SET score = (
                COALESCE(legal_score, 0)
                + COALESCE(google_rating_score, 0)
                + COALESCE(judicial_score, 0)
                + 20
                + 12
            )
        """))
        await session.commit()
        return {"ok": True, "updated": result.rowcount}


@router.post("/clinics/sync-google-ratings")
async def sync_google_ratings(batch_size: int = 30, force_all: bool = False):
    """同步診所的 Google Places 評分 + 評論數 + place_id

    參數：
      batch_size：一次處理幾筆（預設 30）
      force_all：True = 強制全部重抓（即使已有 rating），False = 只抓沒 rating 的
    """
    from datetime import datetime
    from crawlers.google_places import get_clinic_places_info
    from sqlalchemy import select
    from database import AsyncSessionLocal
    from models.clinic import Clinic
    import asyncio as _asyncio

    bs = min(batch_size, 50)

    def _calc_rating_score(rating: float | None, reviews: int | None) -> int:
        if not rating:
            return 0
        star = (15 if rating >= 4.5 else 12 if rating >= 4.0 else 9 if rating >= 3.5
                else 6 if rating >= 3.0 else 3)
        rev = (5 if (reviews or 0) >= 1000 else 4 if (reviews or 0) >= 500
               else 3 if (reviews or 0) >= 100 else 2 if (reviews or 0) >= 1 else 0)
        return star + rev

    async with AsyncSessionLocal() as session:
        from sqlalchemy import text as sql_text
        if force_all:
            # 最久沒同步（含從未同步）的優先 — 用 raw SQL 處理 NULLS FIRST
            stmt = select(Clinic).order_by(
                sql_text("google_rating_synced_at ASC NULLS FIRST"),
                Clinic.id.asc(),
            ).limit(bs)
        else:
            stmt = select(Clinic).where(Clinic.google_rating.is_(None)).order_by(Clinic.id.asc()).limit(bs)
        rows = (await session.execute(stmt)).scalars().all()

        ok = 0
        not_found = 0
        now = datetime.utcnow()
        for c in rows:
            try:
                info = await get_clinic_places_info(c.name or "", c.address or "")
                if info.get("found"):
                    rating = info.get("rating")
                    review_count = info.get("review_count")
                    c.google_place_id = info.get("place_id") or c.google_place_id
                    c.google_rating = rating
                    c.google_review_count = review_count
                    c.google_rating_score = _calc_rating_score(rating, review_count)
                    ok += 1
                else:
                    not_found += 1
            except Exception as e:
                print(f"[sync_google_ratings] {c.id} error: {e}")
            # 不論成功與否都標記已同步，避免下次重複跑
            await session.execute(sql_text(
                "UPDATE clinics SET google_rating_synced_at = :t WHERE id = :id"
            ), {"t": now, "id": c.id})
            await _asyncio.sleep(0.3)
        await session.commit()
        return {"ok": True, "processed": len(rows), "got_rating": ok, "not_found": not_found,
                "message": f"處理 {len(rows)} 筆 → 抓到評分 {ok} 筆"}


@router.post("/trigger-crawl")
async def trigger_crawl(request: Request, background_tasks: BackgroundTasks):
    body = await request.json()
    crawler = body.get("crawler", "")
    VALID = {"places", "judicial", "mohw"}
    if crawler not in VALID:
        raise HTTPException(status_code=400, detail=f"crawler must be one of {VALID}")

    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                existing = await session.get(CrawlerStatus, crawler)
                if existing:
                    existing.status = "running"
                else:
                    session.add(CrawlerStatus(key=crawler, status="running"))
                await session.commit()
    except Exception as e:
        print(f"[trigger-crawl] DB error: {e}")
        status_data = _load_json(_CRAWLER_STATUS_PATH, {})
        status_data[crawler] = {"last_run": None, "status": "running"}
        _save_json(_CRAWLER_STATUS_PATH, status_data)

    background_tasks.add_task(_run_crawler, crawler)
    return {"ok": True, "message": f"{crawler} crawler scheduled"}


@router.get("/alerts")
async def get_alerts():
    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    alerts = []

    try:
        if SessionLocal:
            async with SessionLocal() as session:
                # 來源1：爬蟲失敗告警
                crawler_rows = (await session.execute(select(CrawlerStatus))).scalars().all()
                for r in crawler_rows:
                    is_failed = r.status == "failed" or bool(r.error_message) or bool(r.error)
                    if is_failed:
                        err_msg = r.error_message or r.error or "未知錯誤"
                        alerts.append({
                            "id": f"crawler_{r.key}",
                            "type": "crawler_failed",
                            "title": f"爬蟲失敗：{r.key}",
                            "detail": err_msg,
                            "created_at": _format_dt(r.last_run),
                            "status": "active",
                        })

                # 來源2：資料異常（score 為 null 或 0）
                anomaly_rows = (await session.execute(
                    select(Clinic).where(
                        (Clinic.score == None) | (Clinic.score == 0)
                    ).order_by(Clinic.name).limit(30)
                )).scalars().all()
                for r in anomaly_rows:
                    alerts.append({
                        "id": f"anomaly_{r.id}",
                        "type": "data_anomaly",
                        "title": f"資料異常：{r.name}",
                        "detail": f"診所 {r.name} 的綜合評分為 {'null' if r.score is None else r.score}，請確認資料來源。",
                        "created_at": _format_dt(r.created_at),
                        "status": "active",
                    })

                return {"alerts": alerts}
    except Exception as e:
        print(f"[alerts] DB error, fallback: {e}")

    # JSON fallback
    crawler_status = _load_json(_CRAWLER_STATUS_PATH, {})
    for key, val in crawler_status.items():
        if isinstance(val, dict) and val.get("status") == "failed":
            alerts.append({
                "id": f"crawler_{key}",
                "type": "crawler_failed",
                "title": f"爬蟲失敗：{key}",
                "detail": val.get("error", "未知錯誤"),
                "created_at": val.get("last_run"),
                "status": "active",
            })

    clinics = _load_json(_CLINICS_PATH, [])
    for c in clinics:
        score = c.get("score")
        if score is None or score == 0:
            alerts.append({
                "id": f"anomaly_{c.get('id', '')}",
                "type": "data_anomaly",
                "title": f"資料異常：{c.get('name', '未知診所')}",
                "detail": f"診所 {c.get('name', '')} 的綜合評分為 {score}，請確認資料來源。",
                "created_at": None,
                "status": "active",
            })

    return {"alerts": alerts}


@router.patch("/alerts/resolve/{alert_id:path}")
async def resolve_alert(alert_id: str):
    if not alert_id.startswith("crawler_"):
        raise HTTPException(status_code=400, detail="只有爬蟲失敗類告警支援標記已處理")

    crawler_key = alert_id[len("crawler_"):]
    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()

    try:
        if SessionLocal:
            async with SessionLocal() as session:
                r = await session.get(CrawlerStatus, crawler_key)
                if not r:
                    raise HTTPException(status_code=404, detail="Alert not found")
                r.status = "resolved"
                r.error_message = None
                r.error = None
                await session.commit()
                return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[resolve_alert] DB error, fallback: {e}")

    crawler_status = _load_json(_CRAWLER_STATUS_PATH, {})
    if crawler_key not in crawler_status:
        raise HTTPException(status_code=404, detail="Alert not found")
    crawler_status[crawler_key]["status"] = "resolved"
    crawler_status[crawler_key].pop("error", None)
    _save_json(_CRAWLER_STATUS_PATH, crawler_status)
    return {"ok": True}


def _make_csv_response(headers: list[str], rows: list[list], filename: str) -> StreamingResponse:
    buf = io.StringIO()
    buf.write("\ufeff")  # UTF-8 BOM for Excel compatibility
    w = csv.writer(buf)
    w.writerow(headers)
    w.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv; charset=utf-8-sig",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/clinics")
async def export_clinics_csv():
    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    headers = ["id", "name", "address", "phone", "specialty",
               "google_rating", "google_review_count", "score",
               "legal_score", "judicial_score", "is_partner", "created_at"]
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                rows_db = (await session.execute(select(Clinic).order_by(Clinic.name))).scalars().all()
                rows = [
                    [r.id, r.name, r.address, r.phone, r.specialty,
                     r.google_rating, r.google_review_count, r.score,
                     r.legal_score, r.judicial_score, r.is_partner,
                     _format_dt(r.created_at)]
                    for r in rows_db
                ]
                return _make_csv_response(headers, rows, "clinics_export.csv")
    except Exception as e:
        print(f"[export/clinics] DB error, fallback: {e}")

    clinics = _load_json(_CLINICS_PATH, [])
    rows = [
        [c.get("id"), c.get("name"), c.get("address"), c.get("phone"),
         c.get("specialty"), c.get("google_rating"), c.get("google_review_count"),
         c.get("score"), c.get("legal_score"), c.get("judicial_score"),
         c.get("isPartner", c.get("is_partner", False)), None]
        for c in clinics
    ]
    return _make_csv_response(headers, rows, "clinics_export.csv")


@router.get("/export/unlocks")
async def export_unlocks_csv():
    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    headers = ["id", "clinic_name", "line_user_id", "unlock_type", "unlocked_at"]
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                rows_db = (await session.execute(
                    select(UnlockRecord).order_by(desc(UnlockRecord.time))
                )).scalars().all()
                rows = [
                    [r.id, r.target_name, r.user_id, r.unlock_type, _format_dt(r.time)]
                    for r in rows_db
                ]
                return _make_csv_response(headers, rows, "unlocks_export.csv")
    except Exception as e:
        print(f"[export/unlocks] DB error, fallback: {e}")

    unlocks = _load_json(_UNLOCKS_PATH, [])
    rows = [
        [u.get("id"), u.get("target_name", u.get("clinic_name")),
         u.get("user_id", u.get("line_user_id")),
         u.get("unlock_type"), u.get("time", u.get("unlocked_at"))]
        for u in unlocks
    ]
    return _make_csv_response(headers, rows, "unlocks_export.csv")


@router.get("/export/clinic/{clinic_id}/pdf")
async def export_clinic_json(clinic_id: str):
    """單一診所完整資料匯出（JSON 格式，P3 升級為 PDF）"""
    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                r = await session.get(Clinic, clinic_id)
                if not r:
                    raise HTTPException(status_code=404, detail="Clinic not found")
                return {
                    "id": r.id, "name": r.name, "address": r.address,
                    "phone": r.phone, "specialty": r.specialty,
                    "website": r.website, "is_partner": r.is_partner,
                    "google_rating": r.google_rating,
                    "google_review_count": r.google_review_count,
                    "score": r.score, "legal_score": r.legal_score,
                    "judicial_score": r.judicial_score,
                    "google_rating_score": r.google_rating_score,
                    "dispute_count": r.dispute_count,
                    "score_breakdown": r.score_breakdown,
                    "custom_note": r.custom_note,
                    "created_at": _format_dt(r.created_at),
                    "updated_at": _format_dt(r.updated_at),
                }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[export/clinic/{clinic_id}] DB error, fallback: {e}")

    clinics = _load_json(_CLINICS_PATH, [])
    c = next((x for x in clinics if x.get("id") == clinic_id), None)
    if not c:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return c


@router.get("/conversations")
async def get_conversations(line_user_id: str = "", limit: int = 50, offset: int = 0):
    try:
        from config import DATABASE_URL
        from models.line_conversation import LineConversation
        db_url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
        engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
        SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
        async with SessionLocal() as session:
            q = select(LineConversation).order_by(desc(LineConversation.id))
            if line_user_id:
                q = q.where(LineConversation.line_user_id == line_user_id)
            total = (await session.execute(
                select(func.count()).select_from(q.subquery())
            )).scalar_one()
            rows = (await session.execute(q.offset(offset).limit(limit))).scalars().all()
            return {
                "total": total,
                "conversations": [
                    {
                        "id": r.id,
                        "line_user_id": r.line_user_id,
                        "role": r.role,
                        "message": r.message,
                        "created_at": _format_dt(r.created_at),
                    }
                    for r in rows
                ],
            }
    except Exception as e:
        print(f"[conversations] DB error: {e}")
    return {"total": 0, "conversations": []}


def _get_scoring_session():
    try:
        from config import DATABASE_URL
        from models.scoring_rule import ScoringRule
        db_url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
        engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
        return async_sessionmaker(engine, expire_on_commit=False), ScoringRule
    except Exception:
        return None, None


@router.get("/scoring-rules")
async def get_scoring_rules():
    SessionLocal, ScoringRule = _get_scoring_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                result = await session.execute(
                    select(ScoringRule).order_by(desc(ScoringRule.id)).limit(1)
                )
                row = result.scalar_one_or_none()
                if row:
                    return {
                        "rules": row.rules,
                        "updated_at": _format_dt(row.updated_at),
                        "updated_by": row.updated_by,
                    }
    except Exception as e:
        print(f"[scoring-rules GET] DB error, fallback: {e}")

    saved = _load_json(_SCORING_RULES_PATH, None)
    return {"rules": saved or _DEFAULT_SCORING_RULES, "updated_at": None, "updated_by": None}


@router.post("/scoring-rules")
async def save_scoring_rules(request: Request):
    body = await request.json()
    rules = body.get("rules")
    if not rules:
        raise HTTPException(status_code=400, detail="rules required")

    SessionLocal, ScoringRule = _get_scoring_session()
    try:
        if SessionLocal:
            async with SessionLocal() as session:
                new_rule = ScoringRule(
                    rules=rules,
                    updated_at=_now_tw().replace(tzinfo=None),
                    updated_by="admin",
                )
                session.add(new_rule)
                await session.commit()
                return {"ok": True}
    except Exception as e:
        print(f"[scoring-rules POST] DB error, fallback: {e}")

    _save_json(_SCORING_RULES_PATH, rules)
    return {"ok": True}


async def _run_crawler(crawler: str) -> None:
    SessionLocal, Clinic, UnlockRecord, BroadcastRecord, CrawlerStatus = _get_session()
    now = _now_tw()
    try:
        if crawler == "places":
            from crawlers.places_runner import run as places_run
            await places_run()
        elif crawler == "judicial":
            from crawlers.judicial_runner import run as judicial_run
            await judicial_run()
        elif crawler == "mohw":
            await asyncio.sleep(2)

        if SessionLocal:
            async with SessionLocal() as session:
                existing = await session.get(CrawlerStatus, crawler)
                if existing:
                    existing.status = "success"
                    existing.last_run = now
                else:
                    session.add(CrawlerStatus(key=crawler, status="success", last_run=now))
                await session.commit()
        else:
            raise Exception("no DB")
    except Exception as e:
        try:
            if SessionLocal:
                async with SessionLocal() as session:
                    existing = await session.get(CrawlerStatus, crawler)
                    if existing:
                        existing.status = "failed"
                        existing.last_run = now
                        existing.error = str(e)
                    else:
                        session.add(CrawlerStatus(key=crawler, status="failed", last_run=now, error=str(e)))
                    await session.commit()
        except Exception:
            status_data = _load_json(_CRAWLER_STATUS_PATH, {})
            status_data[crawler] = {"last_run": now.isoformat(), "status": "failed", "error": str(e)}
            _save_json(_CRAWLER_STATUS_PATH, status_data)
