"""
LINE Webhook：驗證簽章、處理 follow / message 事件。
"""
import base64
import hmac
import hashlib
import json
from typing import Any

import httpx

from config import LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET

LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply"


def verify_signature(body: bytes, signature: str | None) -> bool:
    """
    驗證 LINE Webhook 簽章。
    body：原始請求體（未經解析），signature：X-Line-Signature 表頭。
    """
    if not signature or not LINE_CHANNEL_SECRET:
        return False
    expected = base64.b64encode(
        hmac.new(
            LINE_CHANNEL_SECRET.encode("utf-8"),
            body,
            hashlib.sha256,
        ).digest()
    ).decode("utf-8")
    return hmac.compare_digest(expected, signature)


def _reply_text(reply_token: str, text: str) -> None:
    """呼叫 LINE Messaging API 回覆一則文字訊息（同步，供事件迴圈內使用）。"""
    if not LINE_CHANNEL_ACCESS_TOKEN:
        return
    with httpx.Client() as client:
        client.post(
            LINE_REPLY_URL,
            headers={
                "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "replyToken": reply_token,
                "messages": [{"type": "text", "text": text}],
            },
            timeout=10.0,
        )


def _handle_follow(reply_token: str) -> None:
    """使用者加好友：回傳歡迎訊息。"""
    welcome = (
        "您好～歡迎加入 360 醫療 AI 大調查！\n\n"
        "我可以幫您：\n"
        "・查詢合作診所與療程\n"
        "・根據需求推薦適合的診所\n"
        "・預約諮詢\n\n"
        "直接輸入想了解的療程或地區，例如：「台北皮秒雷射」「想打玻尿酸」即可。"
    )
    _reply_text(reply_token, welcome)


def _handle_message(reply_token: str, line_user_id: str, message: dict[str, Any]) -> None:
    """處理使用者文字訊息：呼叫 Gemini handle_message，回傳 AI 回覆。"""
    msg_type = message.get("type")
    if msg_type != "text":
        _reply_text(reply_token, "目前僅支援文字訊息，請輸入文字與我對話。")
        return
    text = (message.get("text") or "").strip()
    if not text:
        _reply_text(reply_token, "請輸入文字內容～")
        return
    try:
        from ai.gemini import handle_message as gemini_handle_message
        reply_text = gemini_handle_message(line_user_id, text)
    except Exception as e:
        import traceback
        print(f"[ERROR] handle_message failed: {e}")
        print(traceback.format_exc())
        reply_text = "抱歉，剛剛出了一點狀況，請再試一次或稍後再問～"
    _reply_text(reply_token, reply_text)


def handle_webhook_body(body: bytes) -> None:
    """
    驗證簽章後解析 body 並處理 events。
    簽章驗證由 main 層負責，此處假設已通過驗證，僅處理 events。
    """
    try:
        data = json.loads(body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return
    events = data.get("events") or []
    for ev in events:
        ev_type = ev.get("type")
        reply_token = ev.get("replyToken")
        if not reply_token:
            continue
        source = ev.get("source") or {}
        line_user_id = source.get("userId") or ""
        if ev_type == "follow":
            _handle_follow(reply_token)
        elif ev_type == "message":
            _handle_message(reply_token, line_user_id, ev.get("message") or {})
