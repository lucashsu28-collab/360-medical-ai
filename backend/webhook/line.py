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


async def _push_text(user_id: str, text: str) -> None:
    if not LINE_CHANNEL_ACCESS_TOKEN or not user_id:
        return
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                LINE_PUSH_URL,
                headers={
                    "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={"to": user_id, "messages": [{"type": "text", "text": text}]},
                timeout=10.0,
            )
            print(f"[LINE PUSH] status={r.status_code}, body={r.text[:200]}", flush=True)
    except Exception as e:
        print(f"[LINE PUSH ERROR] {e}", flush=True)


async def _push_messages(user_id: str, messages: list[dict[str, Any]]) -> None:
    if not LINE_CHANNEL_ACCESS_TOKEN or not user_id or not messages:
        return
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                LINE_PUSH_URL,
                headers={
                    "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={"to": user_id, "messages": messages},
                timeout=10.0,
            )
            print(f"[LINE PUSH] status={r.status_code}, body={r.text[:200]}", flush=True)
    except Exception as e:
        print(f"[LINE PUSH ERROR] {e}", flush=True)


async def _push_flex(user_id: str, alt: str, flex: dict[str, Any]) -> None:
    await _push_messages(user_id, [{"type": "flex", "altText": alt, "contents": flex}])


def push_report_to_user(user_id: str, state: str) -> None:
    """
    用 LINE Push Message 主動發送完整報告給指定用戶。
    state 格式：clinic_xxx 或 doctor_xxx。
    找不到診所/醫師或 LINE API 錯誤時拋出 ValueError / httpx.HTTPStatusError。
    """
    print(f"[push_report] start, state={state!r}", flush=True)
    if not LINE_CHANNEL_ACCESS_TOKEN:
        raise ValueError("LINE_CHANNEL_ACCESS_TOKEN not configured")
    messages: list[dict[str, Any]] = []
    if state.startswith("clinic_"):
        clinic_id = state.replace("clinic_", "", 1)
        from services.recommend import get_clinic_by_id
        from services.report import build_clinic_flex_report
        clinic = get_clinic_by_id(clinic_id)
        print(f"[push_report] clinic found: {clinic is not None}, id={clinic_id}", flush=True)
        if not clinic:
            raise ValueError(f"clinic not found: {clinic_id}")
        name = clinic.get("name") or "該診所"
        messages.append({
            "type": "text",
            "text": f"你剛才在看【{name}】的報告對嗎？\n我幫你把完整評鑑結果整理出來 👇",
        })
        flex = build_clinic_flex_report(clinic)
        print(f"[push_report] flex built ok", flush=True)
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
    try:
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
            print(f"[LINE PUSH RESULT] status={r.status_code} body={r.text[:500]}", flush=True)
            r.raise_for_status()
    except Exception as e:
        import traceback
        print(f"[LINE PUSH ERROR] {e}")
        print(traceback.format_exc())
        raise


async def _handle_follow(user_id: str) -> None:
    """使用者加好友：若有 liff.state（clinic_/doctor_）則送該診所/醫師完整報告，否則一般歡迎。"""
    state = None
    try:
        r = _redis_client()
        state = r.get(LIFF_STATE_KEY + user_id)
        if state:
            r.delete(LIFF_STATE_KEY + user_id)
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
            await _push_messages(user_id, [{"type": "text", "text": welcome}, {"type": "text", "text": report}])
            return

    if state and state.startswith("doctor_"):
        doctor_id = state.replace("doctor_", "", 1)
        from services.recommend import get_doctor_by_id, format_doctor_report
        doctor = get_doctor_by_id(doctor_id)
        if doctor:
            name = doctor.get("name") or "該醫師"
            welcome = f"你剛才在看【{name}】的報告對嗎？\n我幫你把完整結果整理出來 👇"
            report = format_doctor_report(doctor)
            await _push_messages(user_id, [{"type": "text", "text": welcome}, {"type": "text", "text": report}])
            return

    welcome = (
        "您好～歡迎加入 360 醫療 AI 大調查！\n\n"
        "我可以幫您：\n"
        "・查詢合作診所與療程\n"
        "・根據需求推薦適合的診所\n"
        "・預約諮詢\n\n"
        "直接輸入想了解的療程或地區，例如：「台北皮秒雷射」「想打玻尿酸」即可。"
    )
    await _push_text(user_id, welcome)


async def _save_conversation(line_user_id: str, role: str, message: str) -> None:
    """將對話寫入 line_conversations table，失敗時靜默忽略。"""
    try:
        from config import DATABASE_URL
        from models.line_conversation import LineConversation
        from datetime import datetime
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
        db_url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
        engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
        SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
        async with SessionLocal() as session:
            session.add(LineConversation(
                line_user_id=line_user_id,
                role=role,
                message=message[:2000],  # 截斷超長訊息
                created_at=datetime.utcnow(),
            ))
            await session.commit()
    except Exception as e:
        print(f"[save_conversation] DB error: {e}", flush=True)


async def _is_human_mode(user_id: str) -> bool:
    """檢查該用戶是否處於人工客服模式（human_mode = True）。"""
    try:
        from config import DATABASE_URL
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
        from sqlalchemy import text
        db_url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
        engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
        SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
        async with SessionLocal() as session:
            r = await session.execute(
                text("SELECT human_mode FROM line_conversations WHERE user_id = :uid LIMIT 1"),
                {"uid": user_id},
            )
            row = r.fetchone()
            return bool(row and row[0])
    except Exception as e:
        print(f"[human_mode check] error: {e}", flush=True)
        return False


async def _handle_message(user_id: str, message: dict[str, Any]) -> None:
    """處理使用者文字訊息：支援「報告:clinic_xxx」「報告:doctor_xxx」觸發 Flex 報告，其餘走 Gemini。"""
    # 人工客服模式：AI 靜默，讓諮詢師在 LINE OA Manager 直接接聊
    if await _is_human_mode(user_id):
        print(f"[FLOW] user {user_id} in human mode, AI silent", flush=True)
        return

    msg_type = message.get("type")
    if msg_type != "text":
        await _push_text(user_id, "目前僅支援文字訊息，請輸入文字與我對話。")
        return
    text = (message.get("text") or "").strip()
    if not text:
        await _push_text(user_id, "請輸入文字內容～")
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
                await _push_flex(user_id, f"{clinic.get('name', '')} 完整報告", flex)
                return
            await _push_text(user_id, f"找不到診所 ID：{clinic_id}，請確認後再試。")
            return
        if report_id.startswith("doctor_"):
            doctor_id = report_id.replace("doctor_", "", 1)
            from services.recommend import get_doctor_by_id
            from services.report import build_doctor_flex_report
            doctor = get_doctor_by_id(doctor_id)
            if doctor:
                flex = build_doctor_flex_report(doctor)
                await _push_flex(user_id, f"{doctor.get('name', '')} 完整報告", flex)
                return
            await _push_text(user_id, f"找不到醫師 ID：{doctor_id}，請確認後再試。")
            return
        await _push_text(user_id, "請輸入「報告:clinic_診所ID」或「報告:doctor_醫師ID」，例如：報告:clinic_c01")
        return

    # 記錄使用者訊息
    await _save_conversation(user_id, "user", text)

    print(f"[FLOW] calling gemini, user_id={user_id}", flush=True)
    try:
        from ai.gemini import handle_message as gemini_handle_message
        reply_text = gemini_handle_message(user_id, text)
    except Exception as e:
        import traceback
        print(f"[ERROR] handle_message failed: {e}")
        print(traceback.format_exc())
        reply_text = "抱歉，剛剛出了一點狀況，請再試一次或稍後再問～"
    print("[FLOW] gemini done, about to reply", flush=True)

    # 記錄 AI 回覆
    await _save_conversation(user_id, "assistant", reply_text)
    await _push_text(user_id, reply_text)


async def handle_webhook_body(body: bytes) -> None:
    """
    驗證簽章後解析 body 並處理 events。
    簽章驗證由 main 層負責，此處假設已通過驗證，僅處理 events。
    使用 push message（userId），不再使用 reply token。
    """
    try:
        data = json.loads(body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return
    events = data.get("events") or []
    for ev in events:
        ev_type = ev.get("type")
        source = ev.get("source") or {}
        user_id = source.get("userId") or ""
        if not user_id:
            continue
        print(f"[FLOW] event type={ev_type}, source={source.get('type', '')}", flush=True)
        print(f"[webhook] {ev_type} userId={user_id!r}", flush=True)
        if ev_type == "follow":
            await _handle_follow(user_id)
        elif ev_type == "message":
            await _handle_message(user_id, ev.get("message") or {})
