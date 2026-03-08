"""
LINE Webhook：驗證簽章、處理 follow / message 事件。
帶參數加 LINE：follow 時讀取 Redis 的 liff.state，若有 clinic_/doctor_ 則送完整報告。
"""
import base64
import hmac
import hashlib
import json
from typing import Any

import httpx
import redis

from config import LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET, REDIS_URL

LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply"
LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push"
LIFF_STATE_KEY = "line:liff_state:"
LIFF_STATE_TTL = 600  # 10 分鐘


def _redis_client() -> redis.Redis:
    return redis.from_url(REDIS_URL, decode_responses=True)


def set_liff_state(user_id: str, state: str) -> None:
    """寫入 line:liff_state:{user_id} = state，TTL 10 分鐘。供 LIFF 或前端呼叫。"""
    try:
        r = _redis_client()
        r.set(LIFF_STATE_KEY + user_id, state, ex=LIFF_STATE_TTL)
    except Exception:
        pass


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
    """呼叫 LINE Messaging API 回覆一則文字訊息。"""
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


def _reply_messages(reply_token: str, texts: list[str]) -> None:
    """回覆多則文字訊息（同一 reply 一次送出）。"""
    if not LINE_CHANNEL_ACCESS_TOKEN or not texts:
        return
    messages = [{"type": "text", "text": t} for t in texts]
    with httpx.Client() as client:
        client.post(
            LINE_REPLY_URL,
            headers={
                "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            },
            json={"replyToken": reply_token, "messages": messages},
            timeout=10.0,
        )


def _reply_flex(reply_token: str, flex_contents: dict[str, Any], alt_text: str = "報告") -> None:
    """回覆一則 Flex Message。"""
    if not LINE_CHANNEL_ACCESS_TOKEN:
        return
    payload = {
        "type": "flex",
        "altText": alt_text,
        "contents": flex_contents,
    }
    with httpx.Client() as client:
        client.post(
            LINE_REPLY_URL,
            headers={
                "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "replyToken": reply_token,
                "messages": [payload],
            },
            timeout=10.0,
        )


def push_report_to_user(user_id: str, state: str) -> None:
    """
    用 LINE Push Message 主動發送完整報告給指定用戶。
    state 格式：clinic_xxx 或 doctor_xxx。
    找不到診所/醫師或 LINE API 錯誤時拋出 ValueError / httpx.HTTPStatusError。
    """
    if not LINE_CHANNEL_ACCESS_TOKEN:
        raise ValueError("LINE_CHANNEL_ACCESS_TOKEN not configured")
    messages: list[dict[str, Any]] = []
    if state.startswith("clinic_"):
        clinic_id = state.replace("clinic_", "", 1)
        from services.recommend import get_clinic_by_id
        from services.report import build_clinic_flex_report
        clinic = get_clinic_by_id(clinic_id)
        if not clinic:
            raise ValueError(f"clinic not found: {clinic_id}")
        name = clinic.get("name") or "該診所"
        messages.append({
            "type": "text",
            "text": f"你剛才在看【{name}】的報告對嗎？\n我幫你把完整評鑑結果整理出來 👇",
        })
        flex = build_clinic_flex_report(clinic)
        messages.append({
            "type": "flex",
            "altText": f"{name} 完整報告",
            "contents": flex,
        })
    elif state.startswith("doctor_"):
        doctor_id = state.replace("doctor_", "", 1)
        from services.recommend import get_doctor_by_id
        from services.report import build_doctor_flex_report
        doctor = get_doctor_by_id(doctor_id)
        if not doctor:
            raise ValueError(f"doctor not found: {doctor_id}")
        name = doctor.get("name") or "該醫師"
        messages.append({
            "type": "text",
            "text": f"你剛才在看【{name}】的報告對嗎？\n我幫你把完整結果整理出來 👇",
        })
        flex = build_doctor_flex_report(doctor)
        messages.append({
            "type": "flex",
            "altText": f"{name} 完整報告",
            "contents": flex,
        })
    else:
        raise ValueError(f"invalid state: {state}")
    with httpx.Client() as client:
        r = client.post(
            LINE_PUSH_URL,
            headers={
                "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            },
            json={"to": user_id, "messages": messages},
            timeout=10.0,
        )
        r.raise_for_status()


def _handle_follow(reply_token: str, line_user_id: str) -> None:
    """使用者加好友：若有 liff.state（clinic_/doctor_）則送該診所/醫師完整報告，否則一般歡迎。"""
    state = None
    try:
        r = _redis_client()
        state = r.get(LIFF_STATE_KEY + line_user_id)
        if state:
            r.delete(LIFF_STATE_KEY + line_user_id)
    except Exception:
        pass

    if state and state.startswith("clinic_"):
        clinic_id = state.replace("clinic_", "", 1)
        from services.recommend import get_clinic_by_id, format_full_report
        clinic = get_clinic_by_id(clinic_id)
        if clinic:
            name = clinic.get("name") or "該診所"
            welcome = f"你剛才在看【{name}】的報告對嗎？\n我幫你把完整評鑑結果整理出來 👇"
            report = format_full_report(clinic)
            _reply_messages(reply_token, [welcome, report])
            return

    if state and state.startswith("doctor_"):
        doctor_id = state.replace("doctor_", "", 1)
        from services.recommend import get_doctor_by_id, format_doctor_report
        doctor = get_doctor_by_id(doctor_id)
        if doctor:
            name = doctor.get("name") or "該醫師"
            welcome = f"你剛才在看【{name}】的報告對嗎？\n我幫你把完整結果整理出來 👇"
            report = format_doctor_report(doctor)
            _reply_messages(reply_token, [welcome, report])
            return

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
    """處理使用者文字訊息：支援「報告:clinic_xxx」「報告:doctor_xxx」觸發 Flex 報告，其餘走 Gemini。"""
    msg_type = message.get("type")
    if msg_type != "text":
        _reply_text(reply_token, "目前僅支援文字訊息，請輸入文字與我對話。")
        return
    text = (message.get("text") or "").strip()
    if not text:
        _reply_text(reply_token, "請輸入文字內容～")
        return

    # 指令觸發：報告:clinic_001 / 報告:doctor_001
    if text.startswith("報告:"):
        report_id = text[3:].strip()
        if report_id.startswith("clinic_"):
            clinic_id = report_id.replace("clinic_", "", 1)
            from services.recommend import get_clinic_by_id
            from services.report import build_clinic_flex_report
            clinic = get_clinic_by_id(clinic_id)
            if clinic:
                flex = build_clinic_flex_report(clinic)
                _reply_flex(reply_token, flex, alt_text=f"{clinic.get('name', '')} 完整報告")
                return
            _reply_text(reply_token, f"找不到診所 ID：{clinic_id}，請確認後再試。")
            return
        if report_id.startswith("doctor_"):
            doctor_id = report_id.replace("doctor_", "", 1)
            from services.recommend import get_doctor_by_id
            from services.report import build_doctor_flex_report
            doctor = get_doctor_by_id(doctor_id)
            if doctor:
                flex = build_doctor_flex_report(doctor)
                _reply_flex(reply_token, flex, alt_text=f"{doctor.get('name', '')} 完整報告")
                return
            _reply_text(reply_token, f"找不到醫師 ID：{doctor_id}，請確認後再試。")
            return
        _reply_text(reply_token, "請輸入「報告:clinic_診所ID」或「報告:doctor_醫師ID」，例如：報告:clinic_c01")
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
            _handle_follow(reply_token, line_user_id)
        elif ev_type == "message":
            _handle_message(reply_token, line_user_id, ev.get("message") or {})
