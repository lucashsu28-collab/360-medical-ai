"""Admin /api/admin/penalties — 稽查違規紀錄管理介面後端

功能：
- GET /api/admin/penalties              列表（含篩選 status/severity/clinic_id）
- GET /api/admin/penalties/stats        統計
- GET /api/admin/penalties/{id}         單筆詳情（含診所改善說明）
- PATCH /api/admin/penalties/{id}       更新 status / severity / 白話翻譯
- DELETE /api/admin/penalties/{id}      隱藏（status=hidden）
- POST /api/admin/penalties/run-crawler 觸發爬蟲（背景執行）
- GET /api/admin/penalty-appeals        診所申訴列表
- PATCH /api/admin/penalty-appeals/{id} 審核申訴
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from sqlalchemy import desc, func, select, text

from database import AsyncSessionLocal
from models.admin_penalty import AdminPenalty
from models.clinic import Clinic
from models.mention_appeal import MentionAppeal
from models.penalty_clinic_response import PenaltyClinicResponse


router = APIRouter(prefix="/api/admin/penalties", tags=["admin-penalties"])


def _serialize(p: AdminPenalty, clinic_name: str | None = None) -> dict[str, Any]:
    return {
        "id": p.id,
        "target_type": p.target_type,
        "target_id": p.target_id,
        "clinic_name": clinic_name,
        "source": p.source,
        "source_url": p.source_url,
        "penalty_date": p.penalty_date.isoformat() if p.penalty_date else None,
        "agency": p.agency,
        "violation_item": p.violation_item,
        "violation_item_plain": p.violation_item_plain,
        "law_article": p.law_article,
        "fine_amount": p.fine_amount,
        "penalty_type": p.penalty_type,
        "severity": p.severity,
        "is_major": p.is_major,
        "status": p.status,
        "raw_data": p.raw_data,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


@router.get("")
async def list_penalties(
    status: str | None = None,
    severity: str | None = None,
    clinic_id: str | None = None,
    source: str | None = None,
    limit: int = Query(50, le=500),
    offset: int = 0,
):
    async with AsyncSessionLocal() as session:
        stmt = select(AdminPenalty, Clinic.name).join(
            Clinic, AdminPenalty.target_id == Clinic.id, isouter=True
        )
        if status:
            stmt = stmt.where(AdminPenalty.status == status)
        if severity:
            stmt = stmt.where(AdminPenalty.severity == severity)
        if clinic_id:
            stmt = stmt.where(AdminPenalty.target_id == clinic_id)
        if source:
            stmt = stmt.where(AdminPenalty.source == source)

        # total
        count_stmt = stmt.with_only_columns(func.count(AdminPenalty.id))
        total = (await session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(desc(AdminPenalty.penalty_date)).offset(offset).limit(limit)
        rows = (await session.execute(stmt)).all()

        return {
            "total": total,
            "items": [_serialize(p, name) for p, name in rows],
        }


@router.get("/stats")
async def get_stats():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT
                COUNT(*) FILTER (WHERE status = 'active') AS active,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE status = 'hidden') AS hidden,
                COUNT(*) FILTER (WHERE severity = 'severe') AS severe,
                COUNT(*) FILTER (WHERE severity = 'medium') AS medium,
                COUNT(*) FILTER (WHERE severity = 'minor') AS minor,
                COUNT(DISTINCT target_id) FILTER (WHERE status = 'active') AS clinics_affected
            FROM admin_penalties
        """))
        row = result.first()
        return {
            "active": row[0] or 0,
            "pending": row[1] or 0,
            "hidden": row[2] or 0,
            "severe": row[3] or 0,
            "medium": row[4] or 0,
            "minor": row[5] or 0,
            "clinics_affected": row[6] or 0,
        }


@router.get("/{penalty_id}")
async def get_penalty(penalty_id: int):
    async with AsyncSessionLocal() as session:
        stmt = select(AdminPenalty, Clinic.name).join(
            Clinic, AdminPenalty.target_id == Clinic.id, isouter=True
        ).where(AdminPenalty.id == penalty_id)
        row = (await session.execute(stmt)).first()
        if not row:
            raise HTTPException(404, "penalty not found")
        p, name = row

        # 診所改善說明
        resp_stmt = select(PenaltyClinicResponse).where(
            PenaltyClinicResponse.penalty_id == penalty_id
        ).order_by(desc(PenaltyClinicResponse.created_at))
        responses = (await session.execute(resp_stmt)).scalars().all()

        out = _serialize(p, name)
        out["clinic_responses"] = [
            {
                "id": r.id,
                "response_text": r.response_text,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
            }
            for r in responses
        ]
        return out


@router.patch("/{penalty_id}")
async def update_penalty(penalty_id: int, body: dict[str, Any]):
    """允許修改 status / severity / is_major / violation_item_plain"""
    allowed = {"status", "severity", "is_major", "violation_item_plain"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates:
        raise HTTPException(400, "no valid fields to update")

    async with AsyncSessionLocal() as session:
        p = await session.get(AdminPenalty, penalty_id)
        if not p:
            raise HTTPException(404, "penalty not found")
        for k, v in updates.items():
            setattr(p, k, v)
        p.updated_at = datetime.utcnow()
        await session.commit()
        return {"ok": True, "updated": updates}


@router.delete("/{penalty_id}")
async def hide_penalty(penalty_id: int):
    """軟刪除 = status=hidden（保留資料供稽核）"""
    async with AsyncSessionLocal() as session:
        p = await session.get(AdminPenalty, penalty_id)
        if not p:
            raise HTTPException(404, "penalty not found")
        p.status = "hidden"
        p.updated_at = datetime.utcnow()
        await session.commit()
        return {"ok": True}


# ──────────────────────────────────────────────────────────────────
# 觸發爬蟲（背景執行，不阻塞 HTTP）
# ──────────────────────────────────────────────────────────────────


async def _run_news_crawler_background():
    from crawlers.penalty_news import run_news_penalty_crawler
    try:
        stats = await run_news_penalty_crawler()
        print(f"[admin trigger] news crawler done: {stats}")
    except Exception as e:
        print(f"[admin trigger] news crawler failed: {e}")
        import traceback
        traceback.print_exc()


@router.post("/run-crawler")
async def run_crawler(background_tasks: BackgroundTasks, source: str = "news"):
    """觸發爬蟲（背景跑），目前只支援 news"""
    if source != "news":
        raise HTTPException(400, f"source '{source}' not supported")
    background_tasks.add_task(_run_news_crawler_background)
    return {
        "ok": True,
        "message": "爬蟲已在背景啟動，請稍候 5-10 分鐘後查看結果",
        "source": source,
    }
