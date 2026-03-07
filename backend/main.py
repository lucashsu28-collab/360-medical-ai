"""
360 醫療 AI 大調查 — LINE AI 智能顧問後端
FastAPI 入口，LINE Webhook 接收、簽章驗證、事件處理。
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import PlainTextResponse

from config import LINE_CHANNEL_SECRET
from webhook.line import verify_signature, handle_webhook_body

app = FastAPI(
    title="360 醫療 AI 大調查 — LINE 後端",
    description="LINE Webhook 與 AI 顧問後端",
    version="0.1.0",
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
