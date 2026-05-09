"""診所後台稽查違規紀錄 + 申訴 API

掛在 /api/portal/{clinic_id}/penalties — 與 portal.py 同 prefix 風格
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import desc, select

from database import AsyncSessionLocal
from models.admin_penalty import AdminPenalty
from models.penalty_clinic_response import PenaltyClinicResponse
from routers.portal import _auth


router = APIRouter(prefix="/portal/{clinic_id}/penalties", tags=["portal-penalties"])


@router.get("")
async def list_clinic_penalties(
    clinic_id: str,
    authorization: str | None = Header(default=None),
):
    """診所端取自家所有處分（含 active/pending/hidden）"""
    await _auth(authorization, clinic_id)

    async with AsyncSessionLocal() as session:
        stmt = select(AdminPenalty).where(
            AdminPenalty.target_type == "clinic",
            AdminPenalty.target_id == clinic_id,
        ).order_by(desc(AdminPenalty.penalty_date))
        penalties = (await session.execute(stmt)).scalars().all()

        if not penalties:
            return {"items": []}

        # 取所有相關回應
        ids = [p.id for p in penalties]
        resp_stmt = select(PenaltyClinicResponse).where(
            PenaltyClinicResponse.penalty_id.in_(ids)
        ).order_by(desc(PenaltyClinicResponse.created_at))
        all_responses = (await session.execute(resp_stmt)).scalars().all()
        resp_map: dict[int, list[dict]] = {}
        for r in all_responses:
            resp_map.setdefault(r.penalty_id, []).append({
                "id": r.id,
                "response_text": r.response_text,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
            })

        items = []
        for p in penalties:
            items.append({
                "id": p.id,
                "severity": p.severity,
                "is_major": p.is_major,
                "penalty_date": p.penalty_date.isoformat() if p.penalty_date else None,
                "agency": p.agency,
                "violation_item": p.violation_item,
                "violation_item_plain": p.violation_item_plain,
                "law_article": p.law_article,
                "fine_amount": p.fine_amount,
                "penalty_type": p.penalty_type,
                "source": p.source,
                "source_url": p.source_url,
                "status": p.status,
                "responses": resp_map.get(p.id, []),
            })
        return {"items": items}


class ResponseBody(BaseModel):
    response_text: str = Field(..., min_length=1, max_length=200, description="改善說明 ≤ 200 字")


@router.post("/{penalty_id}/responses")
async def submit_response(
    clinic_id: str,
    penalty_id: int,
    body: ResponseBody,
    authorization: str | None = Header(default=None),
):
    """診所提交改善說明（200 字內）→ 進入待審核"""
    await _auth(authorization, clinic_id)

    async with AsyncSessionLocal() as session:
        # 驗證該 penalty 屬於該 clinic
        p = await session.get(AdminPenalty, penalty_id)
        if not p:
            raise HTTPException(404, "處分紀錄不存在")
        if p.target_type != "clinic" or p.target_id != clinic_id:
            raise HTTPException(403, "無權對此處分提交說明")

        new_resp = PenaltyClinicResponse(
            penalty_id=penalty_id,
            clinic_id=clinic_id,
            response_text=body.response_text.strip(),
            status="pending",
        )
        session.add(new_resp)
        await session.commit()
        await session.refresh(new_resp)

        return {
            "ok": True,
            "id": new_resp.id,
            "status": new_resp.status,
            "message": "改善說明已送出，將於 5 個工作天內審核",
        }
