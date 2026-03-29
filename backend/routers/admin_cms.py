"""P2-6: Admin CMS 審核流程 API"""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime

from database import get_db
from services.compliance import BANNED_WORDS, BANNED_PATTERNS

router = APIRouter(prefix="/admin/cms", tags=["admin-cms"])


@router.get("/reviews")
async def get_reviews(
    status: str = Query(""),
    content_type: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    where = []
    params: dict = {}
    if status:
        where.append("cr.status = :status")
        params["status"] = status
    if content_type:
        where.append("cr.content_type = :content_type")
        params["content_type"] = content_type

    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    try:
        r = await db.execute(
            text(f"""
                SELECT cr.id, cr.content_type, cr.content_id, cr.clinic_id,
                       c.name AS clinic_name, cr.status, cr.auto_flag,
                       cr.flag_reasons, cr.reviewer_note, cr.submitted_at,
                       p.title AS preview_title, p.description AS preview_desc
                FROM content_reviews cr
                LEFT JOIN clinics c ON cr.clinic_id = c.id
                LEFT JOIN promotions p ON cr.content_type IN ('promotion','treatment')
                    AND cr.content_id = p.id
                {where_sql}
                ORDER BY cr.auto_flag DESC, cr.submitted_at DESC
                LIMIT 100
            """),
            params,
        )
        rows = r.fetchall()
        return [
            {
                "id": r[0], "content_type": r[1], "content_id": r[2],
                "clinic_id": r[3], "clinic_name": r[4], "status": r[5],
                "auto_flag": r[6], "flag_reasons": r[7] or [],
                "reviewer_note": r[8],
                "submitted_at": str(r[9]) if r[9] else None,
                "preview": {"title": r[10], "description": r[11]},
            }
            for r in rows
        ]
    except Exception as e:
        print(f"[admin_cms] reviews error: {e}")
        return []


class ApproveBody(BaseModel):
    pass


class RejectBody(BaseModel):
    note: str


@router.post("/reviews/{review_id}/approve")
async def approve_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        # 取得審核單
        r = await db.execute(
            text("SELECT content_type, content_id FROM content_reviews WHERE id = :id"),
            {"id": review_id},
        )
        row = r.fetchone()
        if not row:
            return {"success": False, "error": "審核單不存在"}

        content_type, content_id = row

        # 更新審核狀態
        await db.execute(
            text("""
                UPDATE content_reviews
                SET status = 'approved', reviewed_at = NOW()
                WHERE id = :id
            """),
            {"id": review_id},
        )

        # 對應表的 is_active = True
        if content_type in ("promotion", "treatment"):
            await db.execute(
                text("UPDATE promotions SET is_active = TRUE WHERE id = :id"),
                {"id": content_id},
            )

        await db.commit()
        return {"success": True}
    except Exception as e:
        print(f"[admin_cms] approve error: {e}")
        return {"success": False}


@router.post("/reviews/{review_id}/reject")
async def reject_review(
    review_id: int,
    body: RejectBody,
    db: AsyncSession = Depends(get_db),
):
    try:
        await db.execute(
            text("""
                UPDATE content_reviews
                SET status = 'rejected', reviewed_at = NOW(), reviewer_note = :note
                WHERE id = :id
            """),
            {"id": review_id, "note": body.note},
        )
        await db.commit()
        return {"success": True}
    except Exception as e:
        print(f"[admin_cms] reject error: {e}")
        return {"success": False}


@router.get("/banned-words")
async def get_banned_words():
    return {"words": BANNED_WORDS, "patterns": BANNED_PATTERNS}


class BannedWordsUpdate(BaseModel):
    words: list[str]
    patterns: list[str]


@router.put("/banned-words")
async def update_banned_words(body: BannedWordsUpdate, db: AsyncSession = Depends(get_db)):
    # 暫存在 DB state 表
    import json
    try:
        data = json.dumps({"words": body.words, "patterns": body.patterns}, ensure_ascii=False)
        await db.execute(
            text("""
                INSERT INTO state (key, value) VALUES ('banned_words', :v)
                ON CONFLICT (key) DO UPDATE SET value = :v
            """),
            {"v": data},
        )
        await db.commit()
        return {"success": True}
    except Exception as e:
        print(f"[admin_cms] banned words update error: {e}")
        return {"success": False}


# Admin 建立診所後台帳號（P2-4）
class CreateAccountBody(BaseModel):
    clinic_id: str
    email: str
    password: str


@router.post("/clinic-accounts")
async def create_clinic_account(
    body: CreateAccountBody,
    db: AsyncSession = Depends(get_db),
):
    import bcrypt
    try:
        hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
        await db.execute(
            text("""
                INSERT INTO clinic_accounts (clinic_id, email, password_hash)
                VALUES (:cid, :email, :hash)
                ON CONFLICT (clinic_id) DO UPDATE SET email = :email, password_hash = :hash
            """),
            {"cid": body.clinic_id, "email": body.email, "hash": hashed},
        )
        await db.commit()
        return {"success": True, "email": body.email}
    except Exception as e:
        print(f"[admin_cms] create account error: {e}")
        return {"success": False, "error": str(e)}
