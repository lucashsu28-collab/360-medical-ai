"""Public API: 取診所稽查違規紀錄（前台診所詳細頁第 4 維度卡用）

依 docs/PENALTY_DISPLAY_POLICY.md 分層顯示：
  - 近 3 年：完整顯示
  - 3-5 年：摘要顯示（display_mode='summary'）
  - 5 年以上：不返回（重大違規例外）
  - 重大違規 (is_major=True)：永久顯示完整內容
"""
from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, HTTPException
from sqlalchemy import desc, select

from database import AsyncSessionLocal
from models.admin_penalty import AdminPenalty
from models.penalty_clinic_response import PenaltyClinicResponse
from services.penalty_severity import calc_penalty_score


router = APIRouter(tags=["clinic-penalties"])


@router.get("/api/clinics/{clinic_id}/penalties")
async def get_clinic_penalties(clinic_id: str):
    """前台公開 API：返回該診所稽查違規紀錄與評分"""
    today = date.today()
    cutoff_3y = today - timedelta(days=365 * 3)
    cutoff_5y = today - timedelta(days=365 * 5)

    async with AsyncSessionLocal() as session:
        stmt = select(AdminPenalty).where(
            AdminPenalty.target_type == "clinic",
            AdminPenalty.target_id == clinic_id,
            AdminPenalty.status == "active",
        ).order_by(desc(AdminPenalty.penalty_date))
        all_penalties = (await session.execute(stmt)).scalars().all()

        # 取診所改善說明（依 penalty_id 分組）
        if all_penalties:
            ids = [p.id for p in all_penalties]
            resp_stmt = select(PenaltyClinicResponse).where(
                PenaltyClinicResponse.penalty_id.in_(ids),
                PenaltyClinicResponse.status == "approved",
            )
            responses = (await session.execute(resp_stmt)).scalars().all()
            resp_map: dict[int, list[dict]] = {}
            for r in responses:
                resp_map.setdefault(r.penalty_id, []).append({
                    "response_text": r.response_text,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                })
        else:
            resp_map = {}

    # 分層
    full_items: list[dict] = []
    summary_items: list[dict] = []
    major_count = 0

    for p in all_penalties:
        # 重大違規永久顯示
        if p.is_major:
            full_items.append(_serialize(p, "full", resp_map.get(p.id, [])))
            major_count += 1
            continue

        if p.penalty_date >= cutoff_3y:
            full_items.append(_serialize(p, "full", resp_map.get(p.id, [])))
        elif p.penalty_date >= cutoff_5y:
            summary_items.append(_serialize(p, "summary", []))
        # 5+ 年且非重大 → 不返回

    # 評分
    score_input = [
        {"severity": p.severity, "is_major": p.is_major, "penalty_date": p.penalty_date.isoformat()}
        for p in all_penalties
        if p.is_major or p.penalty_date >= cutoff_5y
    ]
    penalty_score = calc_penalty_score(score_input)

    return {
        "clinic_id": clinic_id,
        "penalty_score": penalty_score,
        "summary": {
            "total_displayed": len(full_items) + len(summary_items),
            "full_count": len(full_items),
            "summary_count": len(summary_items),
            "major_count": major_count,
            "has_record": (len(full_items) + len(summary_items)) > 0,
        },
        "penalties_full": full_items,
        "penalties_summary": summary_items,
    }


def _serialize(p: AdminPenalty, display_mode: str, responses: list[dict]) -> dict:
    base = {
        "id": p.id,
        "display_mode": display_mode,
        "severity": p.severity,
        "is_major": p.is_major,
        "penalty_date": p.penalty_date.isoformat(),
    }
    if display_mode == "summary":
        # 摘要模式只給日期 + 嚴重度
        return base

    # 完整模式
    base.update({
        "agency": p.agency,
        "violation_item": p.violation_item,
        "violation_item_plain": p.violation_item_plain,
        "law_article": p.law_article,
        "fine_amount": p.fine_amount,
        "penalty_type": p.penalty_type,
        "source_url": p.source_url,
        "source": p.source,
        "clinic_responses": responses,
    })
    return base
