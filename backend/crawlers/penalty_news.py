"""新聞稿聚合爬蟲（Step 2-B 主力）

策略：
  Google News RSS → 抓多組關鍵字 → Gemini 從每篇新聞提取結構化處分資料
  寫入 admin_penalties，status='pending'（needs_review=True，要 Admin 審核才上前台）

關鍵字：
  - 醫美 違規 罰鍰
  - 醫美診所 衛生局 處分
  - 醫療機構 廣告違規 罰鍰
  - 整形外科 違規 罰款
  - 醫師 廢止 執照
"""
from __future__ import annotations

import asyncio
import re
from datetime import date, datetime
from typing import Iterable
from urllib.parse import quote

import httpx
from lxml import etree

from crawlers.penalty_base import PenaltyCrawler, RawPenaltyRecord
from services.penalty_extractor import extract_penalties_from_text


GOOGLE_NEWS_RSS = "https://news.google.com/rss/search"

SEARCH_QUERIES = [
    "醫美 違規 罰鍰 衛生局",
    "醫美診所 處分 廢止",
    "醫療機構 廣告違規 罰款",
    "整形外科 違規 罰款",
    "醫師 廢止執照",
    "醫療法 第86條 罰鍰 醫美",
    "皮膚科 違規 罰鍰",
]

# 抓 RSS 預設參數
RSS_PARAMS = {
    "hl": "zh-TW",
    "gl": "TW",
    "ceid": "TW:zh-Hant",
}


class GoogleNewsPenaltyCrawler(PenaltyCrawler):
    """從 Google News RSS 抓醫療處分相關新聞，用 Gemini 提取結構化資料"""

    source_code = "news"
    needs_review = True              # 進待審核佇列

    def __init__(self, queries: list[str] | None = None, max_items_per_query: int = 30):
        self.queries = queries or SEARCH_QUERIES
        self.max_items_per_query = max_items_per_query

    async def fetch(self) -> Iterable[RawPenaltyRecord]:
        results: list[RawPenaltyRecord] = []
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            for q in self.queries:
                try:
                    items = await self._fetch_rss(client, q)
                    print(f"[news] '{q}' -> {len(items)} items")
                    for item in items[: self.max_items_per_query]:
                        records = self._extract_records(item)
                        results.extend(records)
                except Exception as e:
                    print(f"[news] '{q}' failed: {e}")
                    continue
                # 不要打太兇
                await asyncio.sleep(1.0)
        return results

    async def _fetch_rss(self, client: httpx.AsyncClient, query: str) -> list[dict]:
        params = {"q": query, **RSS_PARAMS}
        url = f"{GOOGLE_NEWS_RSS}?q={quote(query)}&hl={params['hl']}&gl={params['gl']}&ceid={params['ceid']}"
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
            source_el = item.find("{http://search.yahoo.com/mrss/}source") or item.find("source")
            source_name = (source_el.text or "").strip() if source_el is not None and source_el.text else ""
            items.append({
                "title": title,
                "link": link,
                "pub_date": pub_date,
                "description": description,
                "source_name": source_name,
            })
        return items

    @staticmethod
    def _parse_pub_date(pub_date_str: str) -> date | None:
        """RFC 2822 → date"""
        if not pub_date_str:
            return None
        from email.utils import parsedate_to_datetime
        try:
            return parsedate_to_datetime(pub_date_str).date()
        except (TypeError, ValueError):
            return None

    def _extract_records(self, item: dict) -> list[RawPenaltyRecord]:
        """單篇新聞 → Gemini 提取 → 多筆 RawPenaltyRecord"""
        text = f"{item['title']}\n\n{item['description']}"
        # 移除 description 裡的 HTML tag
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text).strip()

        if len(text) < 30:
            return []

        extracted = extract_penalties_from_text(text)
        if not extracted:
            return []

        pub_date = self._parse_pub_date(item.get("pub_date") or "") or date.today()
        records: list[RawPenaltyRecord] = []
        for idx, e in enumerate(extracted):
            # 解析 Gemini 給的 penalty_date；給不出來就用新聞發布日
            pdate = pub_date
            raw_pdate = e.get("penalty_date")
            if raw_pdate:
                try:
                    pdate = datetime.fromisoformat(str(raw_pdate)).date()
                except (TypeError, ValueError):
                    pass

            # source_url 必須 unique；同一篇新聞抓出多筆時加上 #idx 後綴
            base_url = item.get("link") or ""
            source_url = f"{base_url}#extracted-{idx}" if idx > 0 else base_url
            if not source_url:
                continue

            records.append({
                "source": "news",
                "source_url": source_url,
                "penalty_date": pdate,
                "agency": e.get("agency"),
                "clinic_name": e.get("clinic_name") or "",
                "violation_item": e.get("violation_item"),
                "violation_item_plain": e.get("violation_item_plain"),
                "law_article": e.get("law_article"),
                "fine_amount": int(e.get("fine_amount") or 0),
                "penalty_type": e.get("penalty_type"),
                "raw_data": {
                    "news_title": item.get("title"),
                    "news_source": item.get("source_name"),
                    "news_published": item.get("pub_date"),
                    "extracted_idx": idx,
                },
            })
        return records


async def run_news_penalty_crawler() -> dict:
    """獨立進入點，給 penalty_runner.py / Cloud Scheduler 呼叫"""
    crawler = GoogleNewsPenaltyCrawler()
    return await crawler.run()


if __name__ == "__main__":
    stats = asyncio.run(run_news_penalty_crawler())
    print(f"[news] done: {stats}")
