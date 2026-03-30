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
TUNING_PROMPT_KEY = "ai:tuning:prompt"
TTL_DAYS = 7
TTL_SECONDS = TTL_DAYS * 24 * 3600
MAX_TURNS = 20  # 最多保留 20 輪（user + model 各一則算一輪）


# ── AI 調校 Prompt 組裝與快取 ─────────────────────────────────────────────────

def build_system_prompt(settings: dict) -> str:
    """依 AI 調校設定動態組裝 Gemini system prompt。"""
    tone_map = {
        "formal": "使用正式書面語氣，用語嚴謹專業",
        "warm": "使用親切溫暖的語氣，像朋友一樣陪伴用戶",
        "concise": "使用簡潔俐落的語氣，回答精準不囉嗦",
    }
    colloquial_map = {
        1: "使用書面正式表達，避免口語詞彙，句子完整正式",
        2: "使用自然流暢的表達，適度口語化，避免過於文謅謅",
        3: "使用親切口語化表達，可加入語氣詞如「喔」「囉」「耶」",
        4: "使用活潑超口語化表達，可加入感嘆詞和 emoji，像年輕朋友聊天",
    }
    rhythm_map = {
        "short": "每次回覆控制在 1-2 句以內，快速精準",
        "medium": "每次回覆 3-5 句，適度說明不過度冗長",
        "detailed": "每次回覆可分多段落，完整解釋資料來源與意義",
    }
    tone = settings.get("tone", "warm")
    colloquial = int(settings.get("colloquial_level", 2))
    rhythm = settings.get("rhythm_mode", "medium")

    prompt = (
        "你是「360 醫療 AI 大調查」的 AI 顧問。全程使用繁體中文。\n\n"
        f"語氣風格：{tone_map.get(tone, tone_map['warm'])}\n"
        f"口語化程度：{colloquial_map.get(colloquial, colloquial_map[2])}\n"
        f"回覆節奏：{rhythm_map.get(rhythm, rhythm_map['medium'])}\n"
    )
    if settings.get("auto_rhythm"):
        prompt += (
            "\n自動節奏偵測規則：\n"
            "- 用戶訊息10字以內 → 簡短回覆1-2句\n"
            "- 用戶訊息11-50字 → 中等回覆3-5句\n"
            "- 用戶訊息51字以上 → 詳細完整多段落\n"
            "- 用戶訊息含負面情緒 → 先同理安撫再提供資訊\n"
        )
    guide_logic = settings.get("guide_logic", {})
    prompt += "\n引導邏輯：\n"
    if guide_logic.get("trust_building", True):
        prompt += "- 先建立信任，分享平台資料來源的公正性\n"
    if guide_logic.get("recommend_report", True):
        prompt += "- 引導用戶查詢評鑑報告，強調客觀指標\n"
    if guide_logic.get("lead_booking", True):
        prompt += "- 當用戶有興趣時，主動提供預約連結\n"

    trigger_rules = settings.get("trigger_rules", [])
    if trigger_rules:
        prompt += "\n情境觸發規則：\n"
        for rule in trigger_rules:
            if rule.get("enabled"):
                prompt += f"- 當用戶{rule['condition']}時，{rule['action']}\n"

    banned_words = settings.get("banned_words", [])
    if banned_words:
        prompt += f"\n禁止使用以下詞語：{', '.join(banned_words)}\n"

    faq_answers = settings.get("faq_answers", [])
    if faq_answers:
        prompt += "\n以下是常見問題的標準回答，請盡量依此回覆：\n"
        for faq in faq_answers:
            if faq.get("enabled"):
                prompt += f"Q: {faq['question']}\nA: {faq['answer']}\n\n"

    opening = settings.get("opening_message", "")
    if opening:
        prompt += f"\n開場白（用戶加入時的第一句話）：\n{opening}\n"

    prompt += (
        "\n【重要規則】\n"
        "- 只推薦「合作診所」（isPartner=true）且評分 >= 7.5 的診所；非合作或低於 7.5 的診所絕對不可推薦。\n"
        "- 每次最多推薦 3 家診所，避免選擇障礙。\n"
        "- 若診所有司法糾紛紀錄，必須主動告知、不隱瞞。\n"
        "\n【輸出格式】\n"
        "每則回覆結尾必須單獨一行寫：STAGE: n（n 為 1～7 的數字），表示目前對話階段，不可省略。"
    )
    return prompt


def cache_system_prompt(prompt: str) -> None:
    """將組裝好的 prompt 快取至 Redis（TTL 30 天）。"""
    try:
        r = _redis_client()
        r.set(TUNING_PROMPT_KEY, prompt.encode("utf-8"), ex=86400 * 30)
    except Exception as e:
        print(f"[gemini] cache_system_prompt error: {e}")


def get_tuned_system_prompt() -> str:
    """讀取 Redis 快取的 prompt；若無則回傳預設 SYSTEM_PROMPT。"""
    try:
        r = _redis_client()
        raw = r.get(TUNING_PROMPT_KEY)
        if raw:
            return raw.decode("utf-8")
    except Exception:
        pass
    return SYSTEM_PROMPT


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
        get_tuned_system_prompt()
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
