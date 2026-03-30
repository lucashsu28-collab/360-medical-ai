"""P2-4: 輕量診所後台 portal API（JWT 認證）"""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database import get_db

router = APIRouter(prefix="/portal", tags=["portal"])

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "360medical-portal-secret-change-in-prod")
JWT_ALGO = "HS256"
JWT_EXPIRE_DAYS = 7


# ── JWT helpers ──────────────────────────────────────────────────────────────

def _make_token(clinic_id: str) -> str:
    payload = {
        "clinic_id": clinic_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def _decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload["clinic_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token 已過期")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token 無效")


async def _auth(
    authorization: str | None = Header(default=None),
    clinic_id: str | None = None,
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="需要登入")
    token = authorization.split(" ", 1)[1]

    # Admin bypass: accept the admin password token directly
    admin_token = os.getenv("ADMIN_PASSWORD", "authenticated")
    if token == admin_token:
        return clinic_id or ""

    token_clinic_id = _decode_token(token)
    if clinic_id and token_clinic_id != clinic_id:
        raise HTTPException(status_code=403, detail="無權限存取此診所")
    return token_clinic_id


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def portal_login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT clinic_id, password_hash, is_active FROM clinic_accounts WHERE email = :email"),
        {"email": body.email},
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤")
    clinic_id, password_hash, is_active = row
    if not is_active:
        raise HTTPException(status_code=403, detail="帳號已停用")
    if not bcrypt.checkpw(body.password.encode(), password_hash.encode()):
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤")

    # 更新最後登入時間
    await db.execute(
        text("UPDATE clinic_accounts SET last_login = NOW() WHERE clinic_id = :cid"),
        {"cid": clinic_id},
    )
    await db.commit()

    # 取診所名稱
    r2 = await db.execute(text("SELECT name FROM clinics WHERE id = :id"), {"id": clinic_id})
    clinic_name = (r2.fetchone() or [""])[0]

    return {
        "access_token": _make_token(clinic_id),
        "clinic_id": clinic_id,
        "clinic_name": clinic_name,
    }


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/{clinic_id}/dashboard")
async def portal_dashboard(
    clinic_id: str,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    try:
        r1 = await db.execute(
            text("SELECT COUNT(*) FROM clinic_page_views WHERE clinic_id = :cid AND viewed_at > NOW() - INTERVAL '30 days'"),
            {"cid": clinic_id},
        )
        r2 = await db.execute(
            text("SELECT COUNT(*) FROM appointments WHERE clinic_id = :cid AND created_at > NOW() - INTERVAL '30 days'"),
            {"cid": clinic_id},
        )
        r3 = await db.execute(
            text("SELECT COUNT(*) FROM promotions WHERE clinic_id = :cid AND is_active = TRUE"),
            {"cid": clinic_id},
        )
        return {
            "page_views_30d": r1.scalar() or 0,
            "appointment_count_30d": r2.scalar() or 0,
            "active_promotions": r3.scalar() or 0,
        }
    except Exception as e:
        print(f"[portal] dashboard error: {e}")
        return {"page_views_30d": 0, "appointment_count_30d": 0, "active_promotions": 0}


# ── 基本資料 ──────────────────────────────────────────────────────────────────

class InfoUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    phone: str | None = None
    business_hours: str | None = None


@router.get("/{clinic_id}/info")
async def portal_get_info(
    clinic_id: str,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    r = await db.execute(
        text("SELECT name, address, phone, website, custom_note FROM clinics WHERE id = :id"),
        {"id": clinic_id},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404)
    return {"name": row[0], "address": row[1], "phone": row[2], "website": row[3], "custom_note": row[4]}


@router.put("/{clinic_id}/info")
async def portal_update_info(
    clinic_id: str,
    body: InfoUpdate,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        return {"success": True}
    set_parts = ", ".join(f"{k} = :{k}" for k in updates)
    updates["clinic_id"] = clinic_id
    await db.execute(text(f"UPDATE clinics SET {set_parts} WHERE id = :clinic_id"), updates)
    await db.commit()
    return {"success": True}


# ── 療程管理 ──────────────────────────────────────────────────────────────────

class TreatmentItem(BaseModel):
    name: str
    description: str | None = None
    price_min: int | None = None
    price_max: int | None = None


@router.get("/{clinic_id}/treatments")
async def portal_get_treatments(
    clinic_id: str,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    r = await db.execute(
        text("""
            SELECT id, treatment_name, description, price_min, price_max,
                   price_label, is_active, created_at
            FROM promotions
            WHERE clinic_id = :cid AND treatment_category IS NOT NULL
            ORDER BY created_at DESC
        """),
        {"cid": clinic_id},
    )
    rows = r.fetchall()
    return [{"id": r[0], "name": r[1], "description": r[2], "price_min": r[3],
             "price_max": r[4], "price_label": r[5], "is_active": r[6],
             "created_at": str(r[7])} for r in rows]


@router.post("/{clinic_id}/treatments")
async def portal_add_treatment(
    clinic_id: str,
    body: TreatmentItem,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    from services.compliance import check_compliance
    import json
    await _auth(authorization, clinic_id)

    flag_reasons = check_compliance(f"{body.name} {body.description or ''}")

    r = await db.execute(
        text("""
            INSERT INTO promotions (clinic_id, treatment_name, treatment_category, description, price_min, price_max, is_active)
            VALUES (:cid, :name, '其他', :desc, :pmin, :pmax, FALSE)
            RETURNING id
        """),
        {"cid": clinic_id, "name": body.name, "desc": body.description,
         "pmin": body.price_min, "pmax": body.price_max},
    )
    treatment_id = r.scalar()

    await db.execute(
        text("""
            INSERT INTO content_reviews (content_type, content_id, clinic_id, auto_flag, flag_reasons)
            VALUES ('treatment', :tid, :cid, :flag, :reasons::jsonb)
        """),
        {"tid": treatment_id, "cid": clinic_id,
         "flag": len(flag_reasons) > 0,
         "reasons": json.dumps(flag_reasons, ensure_ascii=False)},
    )
    await db.commit()
    return {"success": True, "id": treatment_id, "pending_review": True}


@router.put("/{clinic_id}/treatments/{item_id}")
async def portal_update_treatment(
    clinic_id: str,
    item_id: int,
    body: TreatmentItem,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    await db.execute(
        text("""
            UPDATE promotions SET treatment_name = :name, description = :desc,
            price_min = :pmin, price_max = :pmax
            WHERE id = :id AND clinic_id = :cid
        """),
        {"name": body.name, "desc": body.description, "pmin": body.price_min,
         "pmax": body.price_max, "id": item_id, "cid": clinic_id},
    )
    await db.commit()
    return {"success": True}


@router.delete("/{clinic_id}/treatments/{item_id}")
async def portal_delete_treatment(
    clinic_id: str,
    item_id: int,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    await db.execute(
        text("DELETE FROM promotions WHERE id = :id AND clinic_id = :cid"),
        {"id": item_id, "cid": clinic_id},
    )
    await db.commit()
    return {"success": True}


# ── 優惠管理 ──────────────────────────────────────────────────────────────────

class PromotionItem(BaseModel):
    title: str
    description: str | None = None
    price_label: str | None = None
    treatment_category: str = "其他"
    expires_at: str | None = None
    is_active: bool = True


@router.get("/{clinic_id}/promotions")
async def portal_get_promotions(
    clinic_id: str,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    r = await db.execute(
        text("""
            SELECT p.id, p.title, p.description, p.price_label, p.expires_at,
                   p.is_active, p.created_at,
                   cr.status AS review_status, cr.reviewer_note
            FROM promotions p
            LEFT JOIN content_reviews cr ON cr.content_type = 'promotion' AND cr.content_id = p.id
            WHERE p.clinic_id = :cid AND p.title IS NOT NULL
            ORDER BY p.created_at DESC
        """),
        {"cid": clinic_id},
    )
    rows = r.fetchall()
    return [{"id": r[0], "title": r[1], "description": r[2], "price_label": r[3],
             "expires_at": str(r[4]) if r[4] else None, "is_active": r[5],
             "created_at": str(r[6]), "review_status": r[7] or "pending",
             "reviewer_note": r[8]} for r in rows]


@router.post("/{clinic_id}/promotions")
async def portal_add_promotion(
    clinic_id: str,
    body: PromotionItem,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    from services.compliance import check_compliance
    import json
    await _auth(authorization, clinic_id)

    flag_reasons = check_compliance(f"{body.title} {body.description or ''}")

    r = await db.execute(
        text("""
            INSERT INTO promotions (clinic_id, title, description, price_label, treatment_category, treatment_name, expires_at, is_active)
            VALUES (:cid, :title, :desc, :price, :cat, :title, :exp, FALSE)
            RETURNING id
        """),
        {"cid": clinic_id, "title": body.title, "desc": body.description,
         "price": body.price_label, "cat": body.treatment_category,
         "exp": body.expires_at},
    )
    promo_id = r.scalar()

    await db.execute(
        text("""
            INSERT INTO content_reviews (content_type, content_id, clinic_id, auto_flag, flag_reasons)
            VALUES ('promotion', :pid, :cid, :flag, :reasons::jsonb)
        """),
        {"pid": promo_id, "cid": clinic_id,
         "flag": len(flag_reasons) > 0,
         "reasons": json.dumps(flag_reasons, ensure_ascii=False)},
    )
    await db.commit()
    return {"success": True, "id": promo_id, "pending_review": True}


@router.put("/{clinic_id}/promotions/{item_id}")
async def portal_update_promotion(
    clinic_id: str,
    item_id: int,
    body: PromotionItem,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    await db.execute(
        text("""
            UPDATE promotions SET title = :title, description = :desc,
            price_label = :price, expires_at = :exp, is_active = :active
            WHERE id = :id AND clinic_id = :cid
        """),
        {"title": body.title, "desc": body.description, "price": body.price_label,
         "exp": body.expires_at, "active": body.is_active, "id": item_id, "cid": clinic_id},
    )
    await db.commit()
    return {"success": True}


@router.delete("/{clinic_id}/promotions/{item_id}")
async def portal_delete_promotion(
    clinic_id: str,
    item_id: int,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    await db.execute(
        text("DELETE FROM promotions WHERE id = :id AND clinic_id = :cid"),
        {"id": item_id, "cid": clinic_id},
    )
    await db.commit()
    return {"success": True}


# ── 醫師管理 ──────────────────────────────────────────────────────────────────

class DoctorItem(BaseModel):
    name: str
    specialty: str | None = None
    photo_url: str | None = None


@router.get("/{clinic_id}/doctors")
async def portal_get_doctors(
    clinic_id: str,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    r = await db.execute(
        text("SELECT doctors FROM clinics WHERE id = :id"),
        {"id": clinic_id},
    )
    row = r.fetchone()
    return {"doctors": (row[0] if row and row[0] else [])}


@router.post("/{clinic_id}/doctors")
async def portal_add_doctor(
    clinic_id: str,
    body: DoctorItem,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    import json, uuid
    await _auth(authorization, clinic_id)
    r = await db.execute(text("SELECT doctors FROM clinics WHERE id = :id"), {"id": clinic_id})
    row = r.fetchone()
    doctors = list(row[0] or []) if row else []
    new_doc = {"id": str(uuid.uuid4())[:8], "name": body.name,
               "specialty": body.specialty, "photo_url": body.photo_url}
    doctors.append(new_doc)
    await db.execute(
        text("UPDATE clinics SET doctors = :d::jsonb WHERE id = :id"),
        {"d": json.dumps(doctors, ensure_ascii=False), "id": clinic_id},
    )
    await db.commit()
    return {"success": True, "doctor": new_doc}


@router.put("/{clinic_id}/doctors/{doctor_id}")
async def portal_update_doctor(
    clinic_id: str,
    doctor_id: str,
    body: DoctorItem,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    import json
    await _auth(authorization, clinic_id)
    r = await db.execute(text("SELECT doctors FROM clinics WHERE id = :id"), {"id": clinic_id})
    row = r.fetchone()
    doctors = list(row[0] or []) if row else []
    for d in doctors:
        if d.get("id") == doctor_id:
            d.update({"name": body.name, "specialty": body.specialty, "photo_url": body.photo_url})
    await db.execute(
        text("UPDATE clinics SET doctors = :d::jsonb WHERE id = :id"),
        {"d": json.dumps(doctors, ensure_ascii=False), "id": clinic_id},
    )
    await db.commit()
    return {"success": True}


@router.delete("/{clinic_id}/doctors/{doctor_id}")
async def portal_delete_doctor(
    clinic_id: str,
    doctor_id: str,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    import json
    await _auth(authorization, clinic_id)
    r = await db.execute(text("SELECT doctors FROM clinics WHERE id = :id"), {"id": clinic_id})
    row = r.fetchone()
    doctors = [d for d in (row[0] or []) if d.get("id") != doctor_id]
    await db.execute(
        text("UPDATE clinics SET doctors = :d::jsonb WHERE id = :id"),
        {"d": json.dumps(doctors, ensure_ascii=False), "id": clinic_id},
    )
    await db.commit()
    return {"success": True}


# ── Gallery ────────────────────────────────────────────────────────────────────

class GalleryItem(BaseModel):
    url: str
    type: str = "image"
    caption: str | None = None


@router.get("/{clinic_id}/gallery")
async def portal_get_gallery(
    clinic_id: str,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    r = await db.execute(text("SELECT gallery FROM clinics WHERE id = :id"), {"id": clinic_id})
    row = r.fetchone()
    return {"gallery": (row[0] if row and row[0] else [])}


@router.post("/{clinic_id}/gallery")
async def portal_add_gallery(
    clinic_id: str,
    body: GalleryItem,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    import json, uuid
    await _auth(authorization, clinic_id)
    r = await db.execute(text("SELECT gallery FROM clinics WHERE id = :id"), {"id": clinic_id})
    row = r.fetchone()
    gallery = list(row[0] or []) if row else []
    new_item = {"id": str(uuid.uuid4())[:8], "url": body.url,
                "type": body.type, "caption": body.caption}
    gallery.append(new_item)
    await db.execute(
        text("UPDATE clinics SET gallery = :g::jsonb WHERE id = :id"),
        {"g": json.dumps(gallery, ensure_ascii=False), "id": clinic_id},
    )
    await db.commit()
    return {"success": True, "item": new_item}


@router.delete("/{clinic_id}/gallery/{item_id}")
async def portal_delete_gallery(
    clinic_id: str,
    item_id: str,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    import json
    await _auth(authorization, clinic_id)
    r = await db.execute(text("SELECT gallery FROM clinics WHERE id = :id"), {"id": clinic_id})
    row = r.fetchone()
    gallery = [g for g in (row[0] or []) if g.get("id") != item_id]
    await db.execute(
        text("UPDATE clinics SET gallery = :g::jsonb WHERE id = :id"),
        {"g": json.dumps(gallery, ensure_ascii=False), "id": clinic_id},
    )
    await db.commit()
    return {"success": True}


# ── 預約列表（唯讀）─────────────────────────────────────────────────────────────

@router.get("/{clinic_id}/appointments")
async def portal_get_appointments(
    clinic_id: str,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await _auth(authorization, clinic_id)
    try:
        r = await db.execute(
            text("""
                SELECT id, user_name, treatment, appointment_time, status, note, created_at
                FROM appointments
                WHERE clinic_id = :cid
                ORDER BY created_at DESC
                LIMIT 100
            """),
            {"cid": clinic_id},
        )
        rows = r.fetchall()
        return {"appointments": [
            {"id": r[0], "user_name": r[1], "treatment": r[2],
             "appointment_time": str(r[3]) if r[3] else None,
             "status": r[4], "note": r[5], "created_at": str(r[6])}
            for r in rows
        ]}
    except Exception as e:
        print(f"[portal] appointments error: {e}")
        return {"appointments": []}
