"""Gemini 從文本提取結構化違規處分資料

用途：
  - PDF 解析後的段落 → 提取結構化欄位
  - 新聞稿 / 媒體報導 → 提取被處分的診所與罰款資訊
  - 衛生局案例展示頁的非結構化敘述

Gemini 2.5 Flash 已在專案內使用（見 backend/ai/gemini.py）
"""
from __future__ import annotations

import json
import re

from google import genai
from google.genai import types

from config import GEMINI_API_KEY


_EXTRACT_PROMPT = """你是行政處分資料分析助手。從以下文本中提取所有「醫療機構或醫師被裁罰」的案件，輸出 JSON 陣列。

每筆案件欄位（缺則填 null，但 clinic_name 必填）：
- clinic_name: 診所或醫療機構名稱（字串）
- penalty_date: 處分日期，YYYY-MM-DD（字串或 null）
- agency: 處分機關，例如「臺北市政府衛生局」
- violation_item: 違規事實簡述（一句話，原文用詞）
- violation_item_plain: 民眾看得懂的白話翻譯（一句話）
- law_article: 違反法條，例如「醫療法第86條」
- fine_amount: 罰款金額（整數，新台幣，無罰款填 0）
- penalty_type: 處分類型，從 ['罰鍰', '停業', '警告', '廢止', '註銷'] 擇一

如無任何醫療機構處分資訊，輸出空陣列 []。
只輸出 JSON 陣列，不要任何說明文字、markdown code fence。

文本：
\"\"\"
{text}
\"\"\"
"""


def extract_penalties_from_text(text: str) -> list[dict]:
    """
    從文本提取處分記錄
    失敗或無資料時回傳空 list
    """
    if not GEMINI_API_KEY:
        print("[penalty_extractor] GEMINI_API_KEY not set")
        return []

    text = (text or "").strip()
    if len(text) < 20:
        return []

    # 限制送進 Gemini 的文本長度（避免過長 + 成本）
    MAX_CHARS = 20000
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[_EXTRACT_PROMPT.format(text=text)],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=4000,
                temperature=0.1,
            ),
        )
        raw = (response.text or "").strip()

        # 防呆：移除 markdown code fence
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()

        data = json.loads(raw)
        if not isinstance(data, list):
            return []

        # 後處理：fine_amount 強制轉 int、移除無 clinic_name 的記錄
        cleaned = []
        for d in data:
            if not isinstance(d, dict):
                continue
            cname = d.get("clinic_name")
            if not cname or not isinstance(cname, str) or not cname.strip():
                continue
            try:
                d["fine_amount"] = int(d.get("fine_amount") or 0)
            except (TypeError, ValueError):
                d["fine_amount"] = 0
            cleaned.append(d)

        return cleaned

    except json.JSONDecodeError as e:
        print(f"[penalty_extractor] JSON parse error: {e}")
        return []
    except Exception as e:
        print(f"[penalty_extractor] error: {e}")
        return []
