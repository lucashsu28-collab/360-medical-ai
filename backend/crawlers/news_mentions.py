"""網路媒體口碑爬蟲（P3-B 主力）

策略：
  1. 用一組廣泛醫美關鍵字抓 Google News RSS
  2. 對每篇文章用單次 Gemini call 同時做：
     - 抽出文中被討論的主要醫療機構名稱
     - 整體情緒分析
     - 業配判定
     - 摘要與關鍵字
  3. 將提取結果包成 RawMention（含 pre_* fast-path 欄位）給 MentionCrawler.run() 處理

優化：避免「抓回後 base 又打 Gemini」造成 token 浪費，故用 pre_* fast-path
"""
from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime
from typing import Iterable
from urllib.parse import quote

import httpx
from google import genai
from google.genai import types
from lxml import etree

from config import GEMINI_API_KEY
from crawlers.mention_base import MentionCrawler, RawMention


GOOGLE_NEWS_RSS = "https://news.google.com/rss/search"

# 廣泛醫美口碑相關關鍵字
SEARCH_QUERIES = [
    "醫美 推薦 診所",
    "醫美 評價 心得",
    "整形 推薦",
    "皮膚科 醫美",
    "醫美診所 心得",
    "醫師 醫美",
    "微整形 推薦",
    "雷射 醫美 評價",
]

RSS_PARAMS = {"hl": "zh-TW", "gl": "TW", "ceid": "TW:zh-Hant"}


_EXTRACT_PROMPT = """你是醫美新聞口碑分析助手。從下列文章中：
1. 抽出主要被討論的「醫療機構名稱」（例：XX 醫美診所、XX 整形外科、XX 皮膚科）
2. 對該機構進行整體情緒判定
3. 判定是否為業配 / 廠商置入
4. 摘要與關鍵字

文章標題：{title}
文章內容：{content}
媒體來源：{source}

請輸出 JSON 陣列，每個元素一筆機構（一篇可能討論 1-3 家）：
[{{
  "clinic_name": "機構名（必填，無則整篇略過）",
  "sentiment": "positive_strong | positive | neutral | negative | negative_strong",
  "sentiment_score": -1.0 ~ 1.0（對應 sentiment）,
  "is_advertorial": true | false,
  "ad_confidence": 0~1,
  "summary": "<= 50 字一句話摘要",
  "keywords": ["關鍵字1", "關鍵字2"]（最多 5 個）
}}]

判定原則：
- positive_strong：得獎、權威認證、名醫專訪
- positive：一般推薦、心得分享多正面
- neutral：純資訊、新聞快報
- negative：消費者投訴、警告、爭議
- negative_strong：醫療事故傷亡、訴訟敗訴、執照廢止

業配特徵：含「合作刊登」「廣編」「廠商提供」「免費體驗」「採訪整理」等
若文中不含明確醫療機構名稱，輸出空陣列 []
只輸出 JSON 陣列，不要 markdown code fence、不要說明文字。
"""


def extract_mentions_from_article(title: str, content: str, source: str = "") -> list[dict]:
    """單次 Gemini call 完成提取 + 情緒分析"""
    if not GEMINI_API_KEY:
        return []
    title = (title or "").strip()
    content = (content or "").strip()
    if len(title) + len(content) < 30:
        return []

    if len(content) > 5000:
        content = content[:5000]

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[_EXTRACT_PROMPT.format(title=title, content=content, source=source)],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=2000,
                temperature=0.1,
            ),
        )
        raw = (response.text or "").strip()
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
        data = json.loads(raw)
        if not isinstance(data, list):
            return []

        cleaned = []
        for d in data:
            if not isinstance(d, dict):
                continue
            cname = d.get("clinic_name")
            if not cname or not isinstance(cname, str):
                continue
            cleaned.append(d)
        return cleaned
    except Exception as e:
        print(f"[news_mentions] extract failed: {e}")
        return []


class NewsMentionsCrawler(MentionCrawler):
    source_type = "news"
    needs_review = False  # 已由 Gemini + 媒體權威度過濾，不需額外人工審核

    def __init__(self, queries: list[str] | None = None, max_items_per_query: int = 30):
        self.queries = queries or SEARCH_QUERIES
        self.max_items_per_query = max_items_per_query

    async def fetch(self) -> Iterable[RawMention]:
        results: list[RawMention] = []
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            for q in self.queries:
                try:
                    items = await self._fetch_rss(client, q)
                    print(f"[news_mentions] '{q}' -> {len(items)} items")
                    for item in items[: self.max_items_per_query]:
                        records = self._extract(item)
                        results.extend(records)
                except Exception as e:
                    print(f"[news_mentions] '{q}' failed: {e}")
                await asyncio.sleep(1.0)
        return results

    async def _fetch_rss(self, client: httpx.AsyncClient, query: str) -> list[dict]:
        url = (
            f"{GOOGLE_NEWS_RSS}?q={quote(query)}"
            f"&hl={RSS_PARAMS['hl']}&gl={RSS_PARAMS['gl']}&ceid={RSS_PARAMS['ceid']}"
        )
        resp = await client.get(url)
        resp.raise_for_status()
        return self._parse_rss(resp.content)

    @staticmethod
    def _parse_rss(content: bytes) -> list[dict]:
        try:
            root = etree.fromstring(content)
        except etree.XMLSyntaxError:
            return []
        items = []
        for item in root.iter("item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            pub_date = (item.findtext("pubDate") or "").strip()
            description = (item.findtext("description") or "").strip()
            source_el = item.find("source")
            source_name = (source_el.text or "").strip() if source_el is not None and source_el.text else ""
            items.append({
                "title": title, "link": link,
                "pub_date": pub_date, "description": description,
                "source_name": source_name,
            })
        return items

    @staticmethod
    def _parse_pub_date(s: str) -> datetime | None:
        if not s:
            return None
        from email.utils import parsedate_to_datetime
        try:
            return parsedate_to_datetime(s).replace(tzinfo=None)
        except (TypeError, ValueError):
            return None

    def _extract(self, item: dict) -> list[RawMention]:
        text = re.sub(r"<[^>]+>", " ", f"{item['title']} {item['description']}")
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) < 30:
            return []

        extracted = extract_mentions_from_article(
            title=item.get("title", ""),
            content=item.get("description", ""),
            source=item.get("source_name") or "",
        )
        if not extracted:
            return []

        pub = self._parse_pub_date(item.get("pub_date") or "")
        records: list[RawMention] = []
        base_url = item.get("link") or ""
        for idx, e in enumerate(extracted):
            url = f"{base_url}#mention-{idx}" if idx > 0 else base_url
            if not url:
                continue
            sentiment = e.get("sentiment", "neutral")
            sentiment_score = float(e.get("sentiment_score") or 0)
            records.append({
                "source_type": "news",
                "source_url": url,
                "source_name": item.get("source_name"),
                "title": item.get("title"),
                "content": item.get("description"),
                "published_at": pub,
                "target_clinic_name": e["clinic_name"],
                "pre_sentiment": sentiment,
                "pre_sentiment_score": sentiment_score,
                "pre_is_advertorial": bool(e.get("is_advertorial", False)),
                "pre_ad_confidence": float(e.get("ad_confidence") or 0),
                "pre_summary": str(e.get("summary") or "")[:80],
                "pre_keywords": [str(k)[:30] for k in (e.get("keywords") or [])[:5]],
                "raw_data": {
                    "news_title": item.get("title"),
                    "news_published": item.get("pub_date"),
                    "extracted_idx": idx,
                },
            })
        return records


async def run_news_mentions_crawler() -> dict:
    return await NewsMentionsCrawler().run()


if __name__ == "__main__":
    import asyncio as _a
    print(_a.run(run_news_mentions_crawler()))
