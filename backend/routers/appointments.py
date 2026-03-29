"""P2-7 預約客服系統 — 預約 API"""
import os
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update, text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

router = APIRouter(prefix="/appointments", tags=["appointments"])

LINE_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")
NOTIFY_GROUP_ID = os.getenv("LINE_NOTIFY_GROUP_ID", "")  # 通知診所用群組（選配）


class BookingRequest(BaseModel):
    clinic_id: str
    treatment_name: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    user_display_name: Optional[str] = None
    user_phone: Optional[str] = None
    user_line_id: Optional[str] = None
    note: Optional[str] = None


class AdminActionRequest(BaseModel):
    appointment_id: int


async def _push_line_message(user_id: str, text: str) -> None:
    """推播 LINE 訊息給用戶"""
    if not LINE_TOKEN or not user_id:
        return
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.line.me/v2/bot/message/push",
            headers={"Authorization": f"Bearer {LINE_TOKEN}", "Content-Type": "application/json"},
            json={"to": user_id, "messages": [{"type": "text", "text": text}]},
        )


async def _set_human_mode(user_id: str, is_human: bool, db: AsyncSession) -> None:
    """切換 LINE 對話模式（AI / 人工）"""
    if not user_id:
        return
    try:
        await db.execute(
            text("UPDATE line_conversations SET human_mode = :mode WHERE user_id = :uid"),
            {"mode": is_human, "uid": user_id},
        )
        await db.commit()
    except Exception:
        pass


@router.post("")
async def create_appointment(req: BookingRequest, db: AsyncSession = Depends(get_db)):
    """建立預約，寫入 DB，推播確認訊息，切換人工客服模式"""
    # 寫入 appointments 表
    result = await db.execute(
        text("""
            INSERT INTO appointments
                (clinic_id, treatment_name, preferred_date, preferred_time,
                 user_display_name, user_phone, user_line_id, note, status, created_at)
            VALUES
                (:clinic_id, :treatment_name, :preferred_date, :preferred_time,
                 :user_display_name, :user_phone, :user_line_id, :note, 'pending', now())
            RETURNING id
        """),
        {
            "clinic_id": req.clinic_id,
            "treatment_name": req.treatment_name,
            "preferred_date": req.preferred_date,
            "preferred_time": req.preferred_time,
            "user_display_name": req.user_display_name,
            "user_phone": req.user_phone,
            "user_line_id": req.user_line_id,
            "note": req.note,
        },
    )
    row = result.fetchone()
    await db.commit()
    appointment_id = row[0] if row else None

    # 取診所名稱
    clinic_name = req.clinic_id
    try:
        cr = await db.execute(text("SELECT name FROM clinics WHERE id = :id"), {"id": req.clinic_id})
        c = cr.fetchone()
        if c:
            clinic_name = c[0]
    except Exception:
        pass

    # 推播確認訊息
    if req.user_line_id:
        msg = (
            f"✅ 預約確認\n\n"
            f"診所：{clinic_name}\n"
            f"療程：{req.treatment_name or '—'}\n"
            f"時間：{req.preferred_date or '—'} {req.preferred_time or ''}\n\n"
            f"我們的諮詢師即將與您聯繫確認細節，請稍候！"
        )
        await _push_line_message(req.user_line_id, msg)
        # 切換為人工客服模式
        await _set_human_mode(req.user_line_id, True, db)

    return {"success": True, "appointment_id": appointment_id, "clinic_name": clinic_name}


@router.get("/admin")
async def list_appointments_admin(
    status: str = "",
    clinic_id: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Admin 預約管理列表"""
    conditions = []
    params: dict = {}
    if status:
        conditions.append("a.status = :status")
        params["status"] = status
    if clinic_id:
        conditions.append("a.clinic_id = :clinic_id")
        params["clinic_id"] = clinic_id

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    rows = await db.execute(
        text(f"""
            SELECT a.id, a.clinic_id, c.name as clinic_name,
                   a.treatment_name, a.preferred_date, a.preferred_time,
                   a.user_display_name, a.user_phone, a.user_line_id,
                   a.note, a.status, a.created_at
            FROM appointments a
            LEFT JOIN clinics c ON c.id = a.clinic_id
            {where}
            ORDER BY a.created_at DESC
            LIMIT 200
        """),
        params,
    )
    cols = ["id", "clinic_id", "clinic_name", "treatment_name", "preferred_date",
            "preferred_time", "user_display_name", "user_phone", "user_line_id",
            "note", "status", "created_at"]
    return [dict(zip(cols, r)) for r in rows.fetchall()]


@router.post("/admin/{appointment_id}/restore-ai")
async def restore_ai_mode(appointment_id: int, db: AsyncSession = Depends(get_db)):
    """Admin 恢復 AI 模式（結束人工接聊）"""
    row = await db.execute(
        text("SELECT user_line_id FROM appointments WHERE id = :id"),
        {"id": appointment_id},
    )
    r = row.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Appointment not found")
    user_line_id = r[0]

    # 切回 AI 模式
    await _set_human_mode(user_line_id, False, db)

    # 推播通知用戶
    if user_line_id:
        await _push_line_message(
            user_line_id,
            "感謝您的諮詢！AI智能顧問已重新為您服務，如需預約或查詢其他資訊請直接發訊息 😊"
        )

    await db.execute(
        text("UPDATE appointments SET status = 'completed' WHERE id = :id"),
        {"id": appointment_id},
    )
    await db.commit()
    return {"success": True}
