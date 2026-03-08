"""
Gemini 1.5 Flash 串接：對話狀態與歷史存 Redis，主入口 handle_message。
"""
import json
import re
from typing import Any

import redis
from google import genai
from google.genai import types

from config import GEMINI_API_KEY, REDIS_URL
from ai.prompts import SYSTEM_PROMPT, get_stage_reminder
from models.state import default_state, state_from_redis
from services.recommend import get_partner_clinics, format_clinics_for_prompt

# Redis key 前綴與 TTL
STATE_KEY = "line:state:"
HISTORY_KEY = "line:history:"
TTL_DAYS = 7
TTL_SECONDS = TTL_DAYS * 24 * 3600
MAX_TURNS = 20  # 最多保留 20 輪（user + model 各一則算一輪）


def _redis_client() -> redis.Redis:
    return redis.from_url(REDIS_URL, decode_responses=False)


def _get_state(user_id: str) -> dict[str, Any]:
    """從 Redis 讀取對話狀態；Redis 不可用時回傳預設狀態。"""
    try:
        r = _redis_client()
        raw = r.get(STATE_KEY + user_id)
        return state_from_redis(raw)
    except Exception:
        return default_state()


def _set_state(user_id: str, state: dict[str, Any]) -> None:
    """寫入對話狀態並設定 TTL；Redis 不可用時略過。"""
    try:
        r = _redis_client()
        key = STATE_KEY + user_id
        r.set(key, json.dumps(state, ensure_ascii=False), ex=TTL_SECONDS)
    except Exception:
        pass


def _get_history(user_id: str) -> list[dict[str, Any]]:
    """從 Redis 讀取對話歷史；Redis 不可用時回傳空列表。"""
    try:
        r = _redis_client()
        raw = r.get(HISTORY_KEY + user_id)
        if raw is None:
            return []
        data = json.loads(raw.decode("utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _set_history(user_id: str, history: list[dict[str, Any]]) -> None:
    """寫入對話歷史，最多保留 MAX_TURNS 輪，並設定 TTL；Redis 不可用時略過。"""
    max_items = MAX_TURNS * 2
    if len(history) > max_items:
        history = history[-max_items:]
    try:
        r = _redis_client()
        key = HISTORY_KEY + user_id
        r.set(key, json.dumps(history, ensure_ascii=False), ex=TTL_SECONDS)
    except Exception:
        pass


def _parse_stage_from_reply(text: str) -> tuple[str, int]:
    """
    從模型回覆末尾解析 STAGE: n，回傳（去掉該行的回覆文字, stage）。
    若未找到則回傳 (原文字, 0)，呼叫端不更新 stage。
    """
    pattern = r"\n\s*STAGE:\s*([1-7])\s*$"
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        stage = int(m.group(1))
        reply_clean = text[: m.start()].strip()
        return reply_clean, stage
    return text.strip(), 0


def handle_message(line_user_id: str, user_message: str) -> str:
    """
    主入口：讀取狀態與歷史、呼叫 Gemini 1.5 Flash、更新狀態與歷史、回傳回覆文字。
    若未設定 GEMINI_API_KEY 或呼叫失敗，回傳 fallback 文案。
    """
    if not GEMINI_API_KEY:
        return "目前 AI 顧問尚未設定，請稍後再試或聯絡管理員。"
    user_message = (user_message or "").strip()
    if not user_message:
        return "請輸入文字內容～"

    state = _get_state(line_user_id)
    history = _get_history(line_user_id)
    stage = state.get("stage", 1)
    stage_reminder = get_stage_reminder(stage)

    # 取得合作且評分 >= 7.5 的診所清單，依狀態篩選後注入 prompt
    clinics = get_partner_clinics(
        district=state.get("district") or None,
        treatment_type=state.get("treatmentType") or None,
    )
    clinics_block = format_clinics_for_prompt(clinics)
    system_with_clinics = (
        SYSTEM_PROMPT
        + "\n\n【當前階段】"
        + stage_reminder
        + "\n\n"
        + clinics_block
        + "\n\n請僅從以上清單推薦診所，勿推薦清單外的診所。"
    )

    print(f"[GEMINI] calling API, stage={state.get('stage')}, msg={user_message[:20]}")
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        # 把歷史記錄轉成正確格式（types.Content + types.Part）
        contents = []
        for h in history:
            role = h.get("role") or "user"
            parts = h.get("parts") or []
            if isinstance(parts, str):
                parts = [parts]
            texts = [p if isinstance(p, str) else (p.get("text") or "") for p in parts if p]
            if texts:
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part(text=texts[0])],
                ))
        # 加上這次用戶訊息
        contents.append(types.Content(
            role="user",
            parts=[types.Part(text=user_message)],
        ))
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_with_clinics,
                max_output_tokens=500,
            ),
        )
        print(f"[GEMINI] response received: {(response.text or '')[:50]}")
        reply_raw = (response.text or "").strip()
    except Exception as e:
        import traceback
        print(f"[GEMINI ERROR] {e}")
        print(traceback.format_exc())
        raise

    reply_text, new_stage = _parse_stage_from_reply(reply_raw)
    if not reply_text:
        reply_text = "收到您的訊息，若有其他想了解的可以繼續問我～"
    if new_stage:
        state["stage"] = new_stage
        _set_state(line_user_id, state)

    # 追加一輪到歷史
    history.append({"role": "user", "parts": [user_message]})
    history.append({"role": "model", "parts": [reply_raw]})  # 存原始回覆（含 STAGE）供下次 context
    _set_history(line_user_id, history)

    return reply_text
