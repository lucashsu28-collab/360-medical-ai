"""Claude Haiku 4.5 — LINE OA AI 顧問

跟 ai/gemini.py 並存：
- LINE 對話用 Claude（直接面對用戶，質感優先）
- 後台分析（口碑/處分/新聞）維持 Gemini（cost 優先）

特色：
- prompt caching：對 system prompt 開 ephemeral cache，重複呼叫 90% 折扣
- 保留 stage 偵測（每則尾端 STAGE: n）
- 保留動態合作診所注入
- Redis 對話狀態 / 歷史延用 ai.gemini 的 _get_state / _get_history（不重複實作）

ENV：ANTHROPIC_API_KEY 必須設定才會生效，否則 fallback 到 Gemini
"""
from __future__ import annotations

import os
import re
from typing import Any

from anthropic import Anthropic

from ai.gemini import (
    _get_history, _set_history, _get_state, _set_state,
    _parse_stage_from_reply, get_tuned_system_prompt,
    handle_message as gemini_handle_message,
)
from ai.prompts import get_stage_reminder
from services.recommend import get_partner_clinics, format_clinics_for_prompt


ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")
MAX_OUTPUT_TOKENS = 600
MAX_HISTORY_TURNS = 20  # user+assistant 各算一則，共 40 則


def _build_system_prompt(stage_reminder: str, clinics_block: str, tuned_prompt: str) -> list[dict]:
    """
    組裝 Claude system prompt，分兩段：
      1. tuned_prompt（管理員調校的長文）→ 開 ephemeral cache（90% 折扣）
      2. stage + 合作診所清單（每次對話會變動）→ 不 cache
    """
    cached = (
        tuned_prompt
        + "\n\n【重要規則】\n"
        + "- 只推薦「合作診所」（isPartner=true）且評分 >= 7.5 的診所；非合作或低於 7.5 的診所絕對不可推薦。\n"
        + "- 每次最多推薦 3 家診所，避免選擇障礙。\n"
        + "- 若診所有司法糾紛紀錄，必須主動告知、不隱瞞。\n"
        + "\n【輸出格式】\n"
        + "每則回覆結尾必須單獨一行寫：STAGE: n（n 為 1～7 的數字），表示目前對話階段，不可省略。"
    )
    dynamic = (
        f"\n【當前階段】{stage_reminder}\n\n{clinics_block}\n\n"
        "請僅從以上清單推薦診所，勿推薦清單外的診所。"
    )
    return [
        {
            "type": "text",
            "text": cached,
            "cache_control": {"type": "ephemeral"},  # 90% 折扣
        },
        {
            "type": "text",
            "text": dynamic,
        },
    ]


def _convert_history(history: list[dict]) -> list[dict]:
    """把 _get_history 的格式（gemini 用 parts）轉成 Claude messages 格式

    Gemini 內部存：[{role: 'user'|'model', parts: [text]}, ...]
    Claude 用：    [{role: 'user'|'assistant', content: text}, ...]
    """
    messages = []
    for h in history:
        role = "user" if h.get("role") == "user" else "assistant"
        parts = h.get("parts") or []
        text = ""
        if isinstance(parts, str):
            text = parts
        elif isinstance(parts, list) and parts:
            first = parts[0]
            text = first if isinstance(first, str) else (first.get("text") if isinstance(first, dict) else "")
        if text:
            messages.append({"role": role, "content": text})
    return messages


def handle_message(line_user_id: str, user_message: str) -> str:
    """LINE OA 對話主入口（Claude 版）

    - 沒設 ANTHROPIC_API_KEY → fallback 到 Gemini
    - 失敗 → fallback 到 Gemini（重試）
    """
    if not ANTHROPIC_API_KEY:
        print("[claude] ANTHROPIC_API_KEY not set, fallback to Gemini")
        return gemini_handle_message(line_user_id, user_message)

    user_message = (user_message or "").strip()
    if not user_message:
        return "請輸入文字內容～"

    state = _get_state(line_user_id)
    history = _get_history(line_user_id)
    stage = state.get("stage", 1)
    stage_reminder = get_stage_reminder(stage)

    # 取合作診所清單注入 prompt
    clinics = get_partner_clinics(
        district=state.get("district") or None,
        treatment_type=state.get("treatmentType") or None,
    )
    clinics_block = format_clinics_for_prompt(clinics)
    tuned = get_tuned_system_prompt()
    system_blocks = _build_system_prompt(stage_reminder, clinics_block, tuned)

    # 歷史 + 本次訊息
    messages = _convert_history(history)
    messages.append({"role": "user", "content": user_message})

    print(f"[CLAUDE] calling API, stage={stage}, msg={user_message[:20]}")
    try:
        client = Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=MAX_OUTPUT_TOKENS,
            system=system_blocks,
            messages=messages,
            extra_headers={
                "anthropic-beta": "prompt-caching-2024-07-31",
            },
        )
        # 取出文字
        reply_raw = ""
        if response.content:
            for block in response.content:
                if hasattr(block, "text"):
                    reply_raw += block.text
        reply_raw = reply_raw.strip()
        print(f"[CLAUDE] response received: {reply_raw[:50]}")

        # cache hit/miss debug
        if hasattr(response, "usage"):
            u = response.usage
            cached = getattr(u, "cache_read_input_tokens", 0) or 0
            print(f"[CLAUDE] usage in={u.input_tokens} out={u.output_tokens} cached={cached}")
    except Exception as e:
        import traceback
        print(f"[CLAUDE ERROR] {e}, fallback to Gemini")
        print(traceback.format_exc())
        return gemini_handle_message(line_user_id, user_message)

    reply_text, new_stage = _parse_stage_from_reply(reply_raw)
    if not reply_text:
        reply_text = "收到您的訊息，若有其他想了解的可以繼續問我～"
    if new_stage:
        state["stage"] = new_stage
        _set_state(line_user_id, state)

    # 追加歷史（沿用 Gemini 的 parts 格式，這樣兩邊互通）
    history.append({"role": "user", "parts": [user_message]})
    history.append({"role": "model", "parts": [reply_raw]})
    _set_history(line_user_id, history)

    return reply_text
