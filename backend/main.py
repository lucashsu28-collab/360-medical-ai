"""
360 醫療 AI 大調查 — LINE AI 智能顧問後端
FastAPI 入口，LINE Webhook 接收、簽章驗證、事件處理。
"""
import logging
import os

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from models.clinic import Clinic as ClinicModel
from config import LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN
from webhook.line import verify_signature, handle_webhook_body, set_liff_state, push_report_to_user
from services.recommend import get_all_clinics
from crawlers.doctor_mohw import search_doctor, get_doctor_detail
from services.report import build_doctor_flex_report
from routers.admin_router import router as admin_router
from routers.clinics_router import router as clinics_router
from routers.promotions import router as promotions_router
from routers.partnership import router as partnership_router
from routers.portal import router as portal_router
from routers.admin_line import router as admin_line_router
from routers.admin_cms import router as admin_cms_router
from routers.appointments import router as appointments_router
from routers.admin_ai_tuning import router as admin_ai_tuning_router
from routers.admin_penalties import router as admin_penalties_router
from routers.clinic_penalties import router as clinic_penalties_router
from routers.portal_penalties import router as portal_penalties_router
from routers.admin_mentions import router as admin_mentions_router
from routers.clinic_mentions import router as clinic_mentions_router
from routers.clinic_trend import router as clinic_trend_router
from routers.admin_schedulers import router as admin_schedulers_router
from routers.portal_brand import router as portal_brand_router

app = FastAPI(
    title="360 醫療 AI 大調查 — LINE 後端",
    description="LINE Webhook 與 AI 顧問後端",
    version="0.1.0",
)
app.include_router(admin_router)
app.include_router(clinics_router)
app.include_router(promotions_router, prefix="/api")
app.include_router(partnership_router, prefix="/api")
app.include_router(portal_router, prefix="/api")
app.include_router(admin_line_router, prefix="/api")
app.include_router(admin_cms_router, prefix="/api")
app.include_router(appointments_router, prefix="/api")
app.include_router(admin_ai_tuning_router, prefix="/api")
app.include_router(admin_penalties_router)  # 已含 /api/admin/penalties prefix
app.include_router(clinic_penalties_router)  # 公開 API：/api/clinics/{id}/penalties
app.include_router(portal_penalties_router, prefix="/api")  # 診所後台：/api/portal/{id}/penalties
app.include_router(admin_mentions_router)  # /api/admin/mentions
app.include_router(clinic_mentions_router)  # 公開 /api/clinics/{id}/mentions
app.include_router(clinic_trend_router)  # 公開 /api/clinics/{id}/reputation/trend
app.include_router(admin_schedulers_router)  # /api/admin/schedulers
app.include_router(portal_brand_router, prefix="/api")  # /api/portal/{id}/brand

from config import DATABASE_URL
_db_url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
_engine = create_async_engine(_db_url, echo=False, pool_pre_ping=True)
_SessionLocal = async_sessionmaker(_engine, expire_on_commit=False)

# 允許 LIFF 前端（Vercel）跨域呼叫 POST /api/liff-state
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "https://360-medical-ai.vercel.app").strip().split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"service": "360-medical-ai-line-backend", "status": "ok"}


@app.get("/health")
async def health():
    return {"status": "ok"}


def _calc_total_score(c: dict) -> float:
    """100-point 五維度: legal(20) + google(20) + judicial(20) + penalty(20) + media(20)
    （社群口碑已下線，由 penalty 維度取代）"""
    sb = c.get("score_breakdown", {}) or {}
    legal    = sb.get("legal",    0) or c.get("legal_score",    0) or 0
    google   = sb.get("google",   0) or c.get("google_rating_score", 0) or 0
    judicial = sb.get("judicial", 0) or c.get("judicial_score", 0) or 0
    penalty  = sb.get("penalty",  20) if sb.get("penalty") is not None else 20  # 預設 20（無紀錄=滿分）
    media    = sb.get("media",    20) if sb.get("media") is not None else 20    # 預設 20（無紀錄=滿分）
    return legal + google + judicial + penalty + media


import re as _re

def _clean_search(s: str) -> str:
    """Remove dots/spaces/dashes so '名媛芭比時尚' matches '名媛芭比.時尚'"""
    return _re.sub(r'[.\s·・\u00b7\u30fb\-_]', '', s)


@app.get("/api/clinics")
async def list_clinics(search: str = "", city: str = "", min_score: float = 0, limit: int = 20, offset: int = 0):
    limit = min(limit, 9999)  # cap at 9999
    try:
        from sqlalchemy import or_, text as sa_text
        async with _SessionLocal() as session:
            q = select(ClinicModel)
            if search:
                clean_kw = _clean_search(search)
                # Use raw SQL text clause: regexp_replace on both name and address columns
                # This is more reliable than func.regexp_replace().ilike() in SQLAlchemy
                CLEAN_PATTERN = r'[.\s\u00b7\u30fb\-_]'
                q = q.where(
                    or_(
                        # cleaned DB column vs cleaned search term
                        sa_text(
                            "regexp_replace(clinics.name, '[.\\\\s·・\\\\-_]', '', 'g') ILIKE :ckw"
                        ).bindparams(ckw=f"%{clean_kw}%"),
                        sa_text(
                            "regexp_replace(clinics.address, '[.\\\\s·・\\\\-_]', '', 'g') ILIKE :ckw2"
                        ).bindparams(ckw2=f"%{clean_kw}%"),
                        # Fallback original search
                        ClinicModel.name.ilike(f"%{search}%"),
                        ClinicModel.address.ilike(f"%{search}%"),
                    )
                )
            if city:
                q = q.where(ClinicModel.address.ilike(f"{city}%"))
            if min_score > 0:
                q = q.where(ClinicModel.score >= min_score)

            count_q = select(func.count()).select_from(q.subquery())
            total = (await session.execute(count_q)).scalar_one()

            rows = (await session.execute(q.offset(offset).limit(limit))).scalars().all()

            # 查詢哪些診所已有後台帳號（一次查完，避免 N+1）
            clinic_ids = [r.id for r in rows]
            has_account_set: set[str] = set()
            if clinic_ids:
                from sqlalchemy import text as _text
                acc_rows = await session.execute(
                    _text("SELECT clinic_id FROM clinic_accounts WHERE clinic_id = ANY(:ids)"),
                    {"ids": clinic_ids},
                )
                has_account_set = {str(row[0]) for row in acc_rows.fetchall()}

            clinics = []
            for r in rows:
                clinics.append({
                    "id": r.id, "name": r.name, "address": r.address,
                    "phone": r.phone, "specialty": r.specialty,
                    "google_rating": r.google_rating,
                    "google_review_count": r.google_review_count,
                    "score": r.score, "legal_score": r.legal_score,
                    "judicial_score": r.judicial_score,
                    "google_rating_score": r.google_rating_score,
                    "score_breakdown": r.score_breakdown,
                    "dispute_count": r.dispute_count,
                    "isPartner": r.is_partner,
                    "custom_note": r.custom_note,
                    "website": r.website,
                    "cont_start": r.cont_start,
                    "treatments": r.treatments,
                    "has_account": str(r.id) in has_account_set,
                })
            return {"clinics": clinics, "total": total}
    except Exception as e:
        print(f"[list_clinics] DB error fallback: {e}")
        all_clinics = get_all_clinics()
        if search:
            all_clinics = [c for c in all_clinics if search.lower() in c.get("name","").lower() or search.lower() in c.get("address","").lower()]
        if city:
            all_clinics = [c for c in all_clinics if city in c.get("address","")]
        total = len(all_clinics)
        return {"clinics": all_clinics[offset:offset+limit], "total": total}


@app.get("/api/doctors")
async def api_search_doctors(name: str):
    results = await search_doctor(name)
    return {"doctors": results, "total": len(results)}


@app.get("/api/doctors/detail")
async def api_get_doctor_detail(doc_seq: str):
    detail = await get_doctor_detail(doc_seq)
    return {"doctor": detail}


@app.get("/api/clinics/{clinic_id}")
async def get_clinic(clinic_id: str):
    try:
        async with _SessionLocal() as session:
            r = await session.get(ClinicModel, clinic_id)
            if r:
                from sqlalchemy import text as _t
                # 取療程（title IS NULL → 由診所後台「療程管理」上傳）
                treat_rows = await session.execute(
                    _t("""
                        SELECT id, treatment_name, description, price_min, price_max, price_label
                        FROM promotions
                        WHERE clinic_id = :cid AND title IS NULL
                          AND treatment_name IS NOT NULL AND is_active = TRUE
                        ORDER BY created_at DESC
                    """),
                    {"cid": clinic_id},
                )
                portal_treatments = [
                    {"id": row[0], "name": row[1], "description": row[2],
                     "price_min": row[3], "price_max": row[4], "price_label": row[5]}
                    for row in treat_rows.fetchall()
                ]
                # 取優惠（title IS NOT NULL → 由診所後台「優惠管理」上傳）
                promo_rows = await session.execute(
                    _t("""
                        SELECT id, title, description, price_label, expires_at
                        FROM promotions
                        WHERE clinic_id = :cid AND title IS NOT NULL AND is_active = TRUE
                        ORDER BY created_at DESC
                    """),
                    {"cid": clinic_id},
                )
                portal_promotions = [
                    {"id": row[0], "title": row[1], "description": row[2],
                     "price_label": row[3],
                     "expires_at": str(row[4]) if row[4] else None}
                    for row in promo_rows.fetchall()
                ]
                # 品牌頁資料（合作診所自訂的 Hero/亮點/療程/院長/Before-After 等）
                brand_page = None
                if r.is_partner:
                    from models.clinic_brand_page import ClinicBrandPage
                    bp_result = await session.execute(
                        sa_text("SELECT id FROM clinic_brand_pages WHERE clinic_id = :cid LIMIT 1"),
                        {"cid": clinic_id},
                    )
                    if bp_result.first():
                        bp = (await session.execute(
                            select(ClinicBrandPage).where(ClinicBrandPage.clinic_id == clinic_id)
                        )).scalar_one_or_none()
                        if bp:
                            brand_page = {
                                "hero_image_url": bp.hero_image_url,
                                "slogan": bp.slogan,
                                "subtitle": bp.subtitle,
                                "features": bp.features or [],
                                "signature_treatments": bp.signature_treatments or [],
                                "director": bp.director,
                                "before_after": bp.before_after or [],
                                "doctor_picks": bp.doctor_picks or [],
                                "treatments_full": bp.treatments_full or [],
                                "testimonials": bp.testimonials or [],
                                "media_reports": bp.media_reports or [],
                            }
                return {
                    "id": r.id, "name": r.name, "address": r.address,
                    "phone": r.phone, "specialty": r.specialty,
                    "google_rating": r.google_rating,
                    "google_review_count": r.google_review_count,
                    "score": r.score, "legal_score": r.legal_score,
                    "judicial_score": r.judicial_score,
                    "google_rating_score": r.google_rating_score,
                    "score_breakdown": r.score_breakdown,
                    "dispute_count": r.dispute_count,
                    "isPartner": r.is_partner,
                    "is_partner": r.is_partner,
                    "custom_note": r.custom_note,
                    "website": r.website,
                    "cont_start": r.cont_start,
                    "treatments": r.treatments,
                    "partner_since": str(r.partner_since) if r.partner_since else None,
                    "line_oa_url": r.line_oa_url,
                    "doctors": r.doctors or [],
                    "promotions": r.promotions or [],
                    "gallery": r.gallery or [],
                    "brand_page": brand_page,
                    "portal_treatments": portal_treatments,
                    "portal_promotions": portal_promotions,
                }
    except Exception:
        pass
    from services.recommend import get_clinic_by_id
    clinic = get_clinic_by_id(clinic_id)
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return clinic


@app.post("/webhook/line", response_class=PlainTextResponse)
async def line_webhook(request: Request):
    """
    接收 LINE Platform 的 Webhook。
    驗證 X-Line-Signature 後，處理 follow / message 事件。
    """
    body = await request.body()
    signature = request.headers.get("x-line-signature") or request.headers.get("X-Line-Signature")

    if not LINE_CHANNEL_SECRET:
        raise HTTPException(status_code=500, detail="LINE_CHANNEL_SECRET not configured")

    if not verify_signature(body, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    await handle_webhook_body(body)
    return "OK"


@app.post("/api/liff-state")
async def api_liff_state(request: Request):
    """
    供 LIFF 或網頁在用戶加好友前寫入 state。
    body: {"userId": "Uxxx", "state": "clinic_c01"} 或 "doctor_d01"
    寫入 Redis line:liff_state:{userId}，TTL 600 秒。
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    user_id = body.get("userId") or body.get("user_id")
    state = body.get("state")
    if not user_id or not state:
        raise HTTPException(status_code=400, detail="userId and state required")
    set_liff_state(user_id, state)
    return {"ok": True}


@app.post("/api/send-report")
async def api_send_report(request: Request):
    """
    已加好友的用戶：用 LINE Push Message 主動發送完整報告。
    body: {"userId": "Uxxx", "state": "clinic_c01"} 或 "doctor_d01"
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    user_id = body.get("userId") or body.get("user_id")
    state = body.get("state")
    if not user_id or not state:
        raise HTTPException(status_code=400, detail="userId and state required")
    # Debug: 比對此 userId 與 webhook 的 source.userId 是否一致（LIFF 為 Login channel、Push 為 Messaging API）
    print(f"[send-report] attempting push userId={user_id!r} state={state}", flush=True)
    print(f"[send-report] about to push, userId={user_id!r}, state={state!r}", flush=True)
    try:
        push_report_to_user(user_id, state)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400:
            try:
                line_body = e.response.json()
                print(f"[send-report] LINE 400 response: userId={user_id!r} line_response={line_body}", flush=True)
                logging.warning("send-report LINE 400: userId=%s state=%s line_response=%s", user_id, state, line_body)
            except Exception:
                pass
            raise HTTPException(status_code=400, detail="用戶尚未加好友，請先加入官方帳號")
        raise HTTPException(status_code=502, detail="LINE API 錯誤")
    except Exception as e:
        import traceback
        print(f"[send-report] UNEXPECTED ERROR: {e}", flush=True)
        print(traceback.format_exc(), flush=True)
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}


LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push"


@app.post("/api/send-doctor-report")
async def send_doctor_report(request: Request):
    """依 user_id、doc_seq 取得衛福部醫師詳情，組 Flex 報告並 Push 至該 LINE 用戶。"""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "invalid json"}, status_code=400)
    user_id = body.get("user_id")
    doc_seq = body.get("doc_seq")
    if not user_id or not doc_seq:
        return JSONResponse({"error": "missing params"}, status_code=400)

    doctor = await get_doctor_detail(doc_seq)
    if not doctor:
        return JSONResponse({"error": "doctor not found"}, status_code=404)

    doctor["doc_seq"] = doc_seq
    flex = build_doctor_flex_report(doctor)
    if not LINE_CHANNEL_ACCESS_TOKEN:
        return JSONResponse({"error": "LINE not configured"}, status_code=500)

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                LINE_PUSH_URL,
                headers={
                    "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={
                    "to": user_id,
                    "messages": [{"type": "flex", "altText": "醫師執照查驗報告", "contents": flex}],
                },
                timeout=10.0,
            )
            r.raise_for_status()
    except httpx.HTTPStatusError as e:
        return JSONResponse({"error": "LINE push failed", "detail": str(e)}, status_code=502)
    except Exception as e:
        return JSONResponse({"error": "LINE push failed", "detail": str(e)}, status_code=500)

    return {"ok": True}
