"""Gemini 情緒分析 + 業配辨識（口碑爬蟲核心服務）

依 docs/REPUTATION_SCORING.md：
  情緒分數：強正 +1.0 / 正面 +0.5 / 中性 0 / 負面 -0.5 / 強負 -1.0
  業配判定：純編輯內容 ×1.0 / 疑似業配 ×0.3
"""
from __future__ import annotations

import json
import re

from google import genai
from google.genai import types

from config import GEMINI_API_KEY


# 業配高風險關鍵字（直接判定為疑似業配，跳過 Gemini call）
_AD_KEYWORDS = [
    "合作刊登", "廣編", "廠商提供", "業者提供",
    "本文由", "與品牌合作", "採訪整理",
    "#合作", "#體驗", "#業配", "#廠商",
    "免費體驗", "感謝廠商", "提供本次",
]


def quick_advertorial_check(text: str) -> tuple[bool, float]:
    """
    純文字關鍵字判定 — 不打 Gemini
    返回 (is_advertorial, confidence)
    """
    if not text:
        return False, 0.0
    hit_count = sum(1 for kw in _AD_KEYWORDS if kw in text)
    if hit_count == 0:
        return False, 0.0
    if hit_count >= 2:
        return True, 0.9
    return True, 0.6


_ANALYZE_PROMPT = """你是醫美口碑分析助手。針對下列關於診所或醫師的文章，進行情緒與業配判定。

文章標題：{title}
文章內容：{content}
文章來源：{source}

請輸出 JSON（單一物件），欄位：
- sentiment: 字串，從 ['positive_strong', 'positive', 'neutral', 'negative', 'negative_strong'] 擇一
- sentiment_score: 浮點數
    - positive_strong → 1.0
    - positive → 0.5
    - neutral → 0
    - negative → -0.5
    - negative_strong → -1.0
- is_advertorial: 布林，是否為業配 / 廣告 / 廠商置入內容
- ad_confidence: 浮點數 0-1，業配判定信心
- key_keywords: 字串陣列，最多 5 個從文章抽取的核心關鍵字
- summary: 一句話摘要（<= 50 字）

判定原則：
- positive_strong：得獎、權威認證、名醫專訪
- positive：一般推薦、心得分享多正面
- neutral：純資訊、新聞快報、診所介紹
- negative：消費者投訴、警告、爭議
- negative_strong：醫療事故傷亡、訴訟敗訴、執照廢止

只輸出 JSON 物件，不要 markdown code fence、不要說明文字。
"""


def analyze_mention(title: str, content: str, source: str = "") -> dict:
    """
    分析單篇 mention，返回情緒 + 業配 + 摘要
    失敗時返回保守預設值（中性、非業配）
    """
    DEFAULT = {
        "sentiment": "neutral",
        "sentiment_score": 0.0,
        "is_advertorial": False,
        "ad_confidence": 0.0,
        "key_keywords": [],
        "summary": "",
    }

    if not GEMINI_API_KEY:
        return DEFAULT

    title = (title or "").strip()
    content = (content or "").strip()
    if len(title) + len(content) < 20:
        return DEFAULT

    # 先做關鍵字快檢，省 Gemini cost
    quick_ad, quick_conf = quick_advertorial_check(title + " " + content)

    # 限制長度（控成本）
    MAX_CHARS = 3000
    if len(content) > MAX_CHARS:
        content = content[:MAX_CHARS]

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[_ANALYZE_PROMPT.format(title=title, content=content, source=source)],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=600,
                temperature=0.1,
            ),
        )
        raw = (response.text or "").strip()
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
        data = json.loads(raw)
        if not isinstance(data, dict):
            return DEFAULT

        # 後處理：sentiment_score 對齊 sentiment
        sentiment_map = {
            "positive_strong": 1.0,
            "positive": 0.5,
            "neutral": 0.0,
            "negative": -0.5,
            "negative_strong": -1.0,
        }
        sentiment = data.get("sentiment", "neutral")
        if sentiment not in sentiment_map:
            sentiment = "neutral"
        data["sentiment"] = sentiment
        data["sentiment_score"] = sentiment_map[sentiment]

        # 業配：取 max(關鍵字, Gemini)
        ai_ad = bool(data.get("is_advertorial", False))
        ai_conf = float(data.get("ad_confidence") or 0.0)
        if quick_ad and quick_conf > ai_conf:
            data["is_advertorial"] = True
            data["ad_confidence"] = quick_conf
        else:
            data["is_advertorial"] = ai_ad
            data["ad_confidence"] = ai_conf

        # 關鍵字 / 摘要 cap
        kws = data.get("key_keywords") or []
        if not isinstance(kws, list):
            kws = []
        data["key_keywords"] = [str(k)[:30] for k in kws[:5]]
        data["summary"] = str(data.get("summary") or "")[:80]

        return data

    except Exception as e:
        print(f"[sentiment_analyzer] error: {e}")
        return DEFAULT
