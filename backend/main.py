"""
360 醫療 AI 大調查 — LINE AI 智能顧問後端
FastAPI 入口，LINE Webhook 接收、簽章驗證、事件處理。
"""
import logging
import os

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from config import LINE_CHANNEL_SECRET
from webhook.line import verify_signature, handle_webhook_body, set_liff_state, push_report_to_user

app = FastAPI(
    title="360 醫療 AI 大調查 — LINE 後端",
    description="LINE Webhook 與 AI 顧問後端",
    version="0.1.0",
)

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

    handle_webhook_body(body)
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
