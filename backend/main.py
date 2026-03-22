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

from config import LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN
from webhook.line import verify_signature, handle_webhook_body, set_liff_state, push_report_to_user
from services.recommend import get_all_clinics
from crawlers.doctor_mohw import search_doctor, get_doctor_detail
from services.report import build_doctor_flex_report
from routers.admin_router import router as admin_router

app = FastAPI(
    title="360 醫療 AI 大調查 — LINE 後端",
    description="LINE Webhook 與 AI 顧問後端",
    version="0.1.0",
)
app.include_router(admin_router)

# 允許 LIFF 前端（Vercel）跨域呼叫 POST /api/liff-state
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "https://360-medical-ai.vercel.app").strip().split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"service": "360-medical-ai-line-backend", "status": "ok"}


@app.get("/health")
async def health():
    return {"status": "ok"}


def _calc_total_score(c: dict) -> float:
    sb = c.get("score_breakdown", {}) or {}
    scores = [
        c.get("google_rating_score") or sb.get("google", 0) or 0,
        sb.get("judicial", 0) or c.get("judicial_score", 0) or 0,
        sb.get("legal", 0) or c.get("legal_score", 0) or 0,
        sb.get("punishment", 0) or 0,
    ]
    return sum(scores)


@app.get("/api/clinics")
async def list_clinics(search: str = "", city: str = "", min_score: float = 0, limit: int = 20, offset: int = 0):
    """回傳真實診所列表，支援搜尋、縣市篩選、最低分數、分頁。"""
    all_clinics = get_all_clinics()
    if search:
        q = search.lower()
        all_clinics = [
            c for c in all_clinics
            if q in c.get("name", "").lower() or q in c.get("address", "").lower()
        ]
    if city:
        all_clinics = [
            c for c in all_clinics
            if city in c.get("address", "")
        ]
    if min_score > 0:
        all_clinics = [
            c for c in all_clinics
            if _calc_total_score(c) >= min_score
        ]
    total = len(all_clinics)
    page_clinics = all_clinics[offset: offset + limit]
    return {"clinics": page_clinics, "total": total}


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
    """回傳單一診所詳情，找不到回傳 404。"""
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
