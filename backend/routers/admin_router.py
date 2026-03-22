"""
Admin API Router — 360醫美後台管理接口
提供統計數據、解鎖記錄、推播記錄、爬蟲觸發等功能。

注意：目前資料以 JSON 檔案為主，Phase 2 接 PostgreSQL 後再替換。
"""
import asyncio
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/api/admin", tags=["admin"])

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_CLINICS_PATH = _DATA_DIR / "clinics_real.json"
_UNLOCKS_PATH = _DATA_DIR / "unlock_records.json"
_BROADCASTS_PATH = _DATA_DIR / "broadcast_records.json"
_CRAWLER_STATUS_PATH = _DATA_DIR / "crawler_status.json"


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

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


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s)
    except Exception:
        return None


# ──────────────────────────────────────────────
# GET /api/admin/stats
# ──────────────────────────────────────────────

@router.get("/stats")
async def get_stats():
    """
    回傳平台統計數據：
    - today_unlocks / total_unlocks
    - line_sent_today
    - crawler_status（三個爬蟲的最後執行時間與狀態）
    """
    unlocks: list[dict] = _load_json(_UNLOCKS_PATH, [])
    broadcasts: list[dict] = _load_json(_BROADCASTS_PATH, [])
    crawler_status: dict = _load_json(_CRAWLER_STATUS_PATH, {
        "places": {"last_run": None, "status": "unknown"},
        "judicial": {"last_run": None, "status": "unknown"},
        "mohw": {"last_run": None, "status": "unknown"},
    })

    now = _now_tw()
    today_str = now.strftime("%Y-%m-%d")

    today_unlocks = sum(
        1 for u in unlocks
        if u.get("time", "").startswith(today_str)
    )
    line_sent_today = sum(
        1 for b in broadcasts
        if b.get("sent_at", "").startswith(today_str)
    )

    return {
        "today_unlocks": today_unlocks,
        "total_unlocks": len(unlocks),
        "line_sent_today": line_sent_today,
        "crawler_status": crawler_status,
    }


# ──────────────────────────────────────────────
# GET /api/admin/unlocks
# ──────────────────────────────────────────────

@router.get("/unlocks")
async def get_unlocks(
    period: str = "all",
    limit: int = 20,
    offset: int = 0,
):
    """
    回傳解鎖記錄。period: today | week | all
    """
    records: list[dict] = _load_json(_UNLOCKS_PATH, [])
    records = sorted(records, key=lambda x: x.get("time", ""), reverse=True)

    now = _now_tw()
    if period == "today":
        today_str = now.strftime("%Y-%m-%d")
        records = [r for r in records if r.get("time", "").startswith(today_str)]
    elif period == "week":
        week_ago = (now - timedelta(days=7)).isoformat()
        records = [r for r in records if r.get("time", "") >= week_ago]

    total = len(records)
    page_records = records[offset: offset + limit]

    return {"total": total, "unlocks": page_records}


# ──────────────────────────────────────────────
# POST /api/admin/log-unlock（內部呼叫，記錄解鎖事件）
# ──────────────────────────────────────────────

@router.post("/log-unlock")
async def log_unlock(request: Request):
    """
    記錄一筆解鎖事件到 unlock_records.json。
    body: { user_id, target_name, unlock_type }
    """
    body = await request.json()
    user_id = body.get("user_id", "")
    target_name = body.get("target_name", "")
    unlock_type = body.get("unlock_type", "clinic")

    records: list[dict] = _load_json(_UNLOCKS_PATH, [])
    records.append({
        "id": f"ul_{len(records)+1:05d}",
        "time": _now_tw().isoformat(),
        "user_id": user_id,
        "target_name": target_name,
        "unlock_type": unlock_type,
    })
    _save_json(_UNLOCKS_PATH, records)
    return {"ok": True}


# ──────────────────────────────────────────────
# GET /api/admin/broadcasts
# ──────────────────────────────────────────────

@router.get("/broadcasts")
async def get_broadcasts(limit: int = 50, offset: int = 0):
    """回傳 LINE 推播記錄。"""
    records: list[dict] = _load_json(_BROADCASTS_PATH, [])
    records = sorted(records, key=lambda x: x.get("sent_at", ""), reverse=True)
    total = len(records)
    return {"total": total, "broadcasts": records[offset: offset + limit]}


# ──────────────────────────────────────────────
# PUT /api/admin/clinics/{clinic_id}
# ──────────────────────────────────────────────

@router.put("/clinics/{clinic_id}")
async def update_clinic(clinic_id: str, request: Request):
    """
    更新診所的 custom_note 欄位。
    body: { custom_note: string }
    """
    body = await request.json()
    custom_note = body.get("custom_note", "")

    clinics: list[dict] = _load_json(_CLINICS_PATH, [])
    updated = False
    for c in clinics:
        if c.get("id") == clinic_id:
            c["custom_note"] = custom_note
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Clinic not found")

    _save_json(_CLINICS_PATH, clinics)
    return {"ok": True}


# ──────────────────────────────────────────────
# POST /api/admin/send-test
# ──────────────────────────────────────────────

@router.post("/send-test")
async def send_test(request: Request):
    """
    手動發送 LINE 測試訊息。
    body: { user_id, message_type, clinic_id?, text? }
    """
    from config import LINE_CHANNEL_ACCESS_TOKEN
    import httpx

    body = await request.json()
    user_id: str = body.get("user_id", "")
    message_type: str = body.get("message_type", "clinic")
    clinic_id: str = body.get("clinic_id", "")
    custom_text: str = body.get("text", "")

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    if message_type == "custom":
        if not custom_text:
            raise HTTPException(status_code=400, detail="text required for custom type")
        messages = [{"type": "text", "text": custom_text}]
    elif message_type == "clinic":
        from services.recommend import get_clinic_by_id
        from services.report import build_clinic_flex_report
        clinic = get_clinic_by_id(clinic_id)
        if not clinic:
            raise HTTPException(status_code=404, detail="Clinic not found")
        flex = build_clinic_flex_report(clinic)
        messages = [{"type": "flex", "altText": f"{clinic['name']} 診所報告", "contents": flex}]
    elif message_type == "doctor":
        raise HTTPException(status_code=400, detail="Doctor report requires doc_seq; use /api/send-doctor-report")
    else:
        raise HTTPException(status_code=400, detail="Invalid message_type")

    if not LINE_CHANNEL_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="LINE not configured")

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.line.me/v2/bot/message/push",
            headers={
                "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            },
            json={"to": user_id, "messages": messages},
            timeout=10.0,
        )
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"LINE push failed: {r.text}")

    # 記錄推播
    records: list[dict] = _load_json(_BROADCASTS_PATH, [])
    clinic_name = ""
    if message_type == "clinic" and clinic_id:
        from services.recommend import get_clinic_by_id
        c = get_clinic_by_id(clinic_id)
        clinic_name = c["name"] if c else clinic_id
    records.append({
        "id": f"bc_{len(records)+1:05d}",
        "sent_at": _now_tw().isoformat(),
        "user_id": user_id,
        "message_type": message_type,
        "target_name": clinic_name or custom_text[:20],
        "status": "success",
    })
    _save_json(_BROADCASTS_PATH, records)

    return {"ok": True}


# ──────────────────────────────────────────────
# POST /api/admin/trigger-crawl
# ──────────────────────────────────────────────

@router.post("/trigger-crawl")
async def trigger_crawl(request: Request):
    """
    手動觸發爬蟲（背景執行）。
    body: { crawler: "places" | "judicial" | "mohw" }
    """
    body = await request.json()
    crawler = body.get("crawler", "")

    VALID = {"places", "judicial", "mohw"}
    if crawler not in VALID:
        raise HTTPException(status_code=400, detail=f"crawler must be one of {VALID}")

    # 更新狀態為 running
    status_data: dict = _load_json(_CRAWLER_STATUS_PATH, {
        "places": {"last_run": None, "status": "unknown"},
        "judicial": {"last_run": None, "status": "unknown"},
        "mohw": {"last_run": None, "status": "unknown"},
    })
    status_data[crawler]["status"] = "running"
    _save_json(_CRAWLER_STATUS_PATH, status_data)

    # 背景非同步執行
    asyncio.create_task(_run_crawler(crawler))

    return {"ok": True, "message": f"{crawler} crawler scheduled"}


async def _run_crawler(crawler: str) -> None:
    """背景執行爬蟲，完成後更新 crawler_status.json。"""
    status_data: dict = _load_json(_CRAWLER_STATUS_PATH, {})
    try:
        if crawler == "places":
            from crawlers.places_runner import run as places_run
            await places_run()
        elif crawler == "judicial":
            from crawlers.judicial_runner import run as judicial_run
            await judicial_run()
        elif crawler == "mohw":
            # Phase 1 待開發
            await asyncio.sleep(2)

        status_data[crawler] = {
            "last_run": _now_tw().isoformat(),
            "status": "success",
        }
    except Exception as e:
        status_data[crawler] = {
            "last_run": _now_tw().isoformat(),
            "status": "failed",
            "error": str(e),
        }
    finally:
        _save_json(_CRAWLER_STATUS_PATH, status_data)
