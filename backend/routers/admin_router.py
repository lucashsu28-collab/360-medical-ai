"""
Admin API Router - 360醫療AI大調查
Phase 2: 從 PostgreSQL 讀取資料，JSON fallback 保底
"""
import asyncio
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from sqlalchemy import select, func, update, desc
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

router = APIRouter(prefix="/api/admin", tags=["admin"])

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_CLINICS_PATH = _DATA_DIR / "clinics_real.json"
_UNLOCKS_PATH = _DATA_DIR / "unlock_records.json"
_BROADCASTS_PATH = _DATA_DIR / "broadcast_records.json"
_CRAWLER_STATUS_PATH = _DATA_DIR / "crawler_status.json"


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
                    id=record_id, time=now,
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
