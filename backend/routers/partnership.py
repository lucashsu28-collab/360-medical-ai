"""P2-3: 我想合作 — 診所詢問表單 API"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database import get_db

router = APIRouter(prefix="/partnership", tags=["partnership"])


class InquiryRequest(BaseModel):
    clinic_name: str
    contact: str
    inquiry: str


@router.post("/inquiry")
async def submit_inquiry(body: InquiryRequest, db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(
            text("""
                INSERT INTO partnership_inquiries (clinic_name, contact, inquiry)
                VALUES (:clinic_name, :contact, :inquiry)
            """),
            {"clinic_name": body.clinic_name, "contact": body.contact, "inquiry": body.inquiry},
        )
        await db.commit()
    except Exception as e:
        print(f"[partnership] DB error: {e}")
        # 即使 DB 失敗仍回傳 LINE URL，確保用戶能聯繫到我們
    return {"success": True, "line_url": "https://lin.ee/6sTCRzm"}
