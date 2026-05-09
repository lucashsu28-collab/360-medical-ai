"""社群口碑爬蟲（P3-C）

社群平台普遍有反爬機制（Dcard / Mobile01 對非授權 client 有 rate limit），
採用務實組合策略：

  軌道 1：PTT atom RSS（公開、結構穩定）
    - https://www.ptt.cc/atom/MakeUp.xml
    - https://www.ptt.cc/atom/BeautySalon.xml

  軌道 2：Google News 加上社群類關鍵字（撈被新聞引用的社群熱議）
    - 「Dcard 醫美」「PTT 整形」「醫美 心得」「整形 經驗」

  軌道 3（P4）：Dcard 公開 JSON、Mobile01、痞客邦（受反爬限制，後續再優化）

為每篇文章用 Gemini 提取被討論的診所名 + 情緒分析（同 P3-B 的 fast-path）
"""
from __future__ import annotations

import asyncio
import re
from datetime import datetime
from typing import Iterable
from urllib.parse import quote

import httpx
from lxml import etree

from crawlers.mention_base import MentionCrawler, RawMention
from crawlers.news_mentions import extract_mentions_from_article


# ── 軌道 1：PTT atom feeds ─────────────────────────────────────────────────

PTT_FEEDS = {
    "PTT MakeUp": "https://www.ptt.cc/atom/MakeUp.xml",
    "PTT BeautySalon": "https://www.ptt.cc/atom/BeautySalon.xml",
}


class PTTRSSCrawler(MentionCrawler):
    """PTT 美容類版面 atom RSS"""
    source_type = "ptt"
    needs_review = False

    async def fetch(self) -> Iterable[RawMention]:
        results: list[RawMention] = []
        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; 360-medical-ai/1.0)",
                "Cookie": "over18=1",  # PTT 18 歲確認
            },
        ) as client:
            for board_name, feed_url in PTT_FEEDS.items():
                try:
                    resp = await client.get(feed_url)
                    resp.raise_for_status()
                    items = self._parse_atom(resp.content)
                    print(f"[ptt] {board_name} → {len(items)} items")
                    for item in items:
                        records = self._extract(item, board_name)
                        results.extend(records)
                    await asyncio.sleep(2.0)  # 避免被 ban
                except Exception as e:
                    print(f"[ptt] {board_name} failed: {e}")
                    continue
        return results

    @staticmethod
    def _parse_atom(content: bytes) -> list[dict]:
        try:
            root = etree.fromstring(content)
        except etree.XMLSyntaxError:
            return []
        ns = {"a": "http://www.w3.org/2005/Atom"}
        items = []
        for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):
            title = (entry.findtext("a:title", namespaces=ns) or "").strip()
            link_el = entry.find("a:link", namespaces=ns)
            link = link_el.get("href") if link_el is not None else ""
            content_text = (entry.findtext("a:content", namespaces=ns) or "").strip()
            updated = (entry.findtext("a:updated", namespaces=ns) or "").strip()
            author = ""
            author_el = entry.find("a:author/a:name", namespaces=ns)
            if author_el is not None and author_el.text:
                author = author_el.text.strip()
            items.append({
                "title": title, "link": link,
                "content": content_text, "updated": updated,
                "author": author,
            })
        return items

    @staticmethod
    def _parse_iso(s: str) -> datetime | None:
        if not s:
            return None
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)
        except (TypeError, ValueError):
            return None

    def _extract(self, item: dict, board_name: str) -> list[RawMention]:
        # PTT atom content 是 HTML，剝除 tag
        content = re.sub(r"<[^>]+>", " ", item.get("content") or "")
        content = re.sub(r"\s+", " ", content).strip()
        if len(content) < 50:
            return []

        extracted = extract_mentions_from_article(
            title=item.get("title", ""),
            content=content,
            source=board_name,
        )
        if not extracted:
            return []

        pub = self._parse_iso(item.get("updated") or "")
        records: list[RawMention] = []
        for idx, e in enumerate(extracted):
            url = item.get("link") or ""
            if not url:
                continue
            url_with_idx = f"{url}#mention-{idx}" if idx > 0 else url

            # PTT 推 / 噓互動：暫時用文章內 [推] [噓] 計數（簡化版）
            push_count = content.count("推 ")
            shu_count = content.count("噓 ")
            interaction_weight = 1.5 if (shu_count > 0 and shu_count > push_count * 2) else \
                                 1.3 if push_count >= 100 else \
                                 1.0 if push_count >= 10 else 0.6

            records.append({
                "source_type": "ptt",
                "source_url": url_with_idx,
                "source_name": board_name,
                "title": item.get("title"),
                "content": content[:1000],
                "author": item.get("author"),
                "published_at": pub,
                "target_clinic_name": e["clinic_name"],
                "interaction_likes": push_count,
                "interaction_dislikes": shu_count,
                "interaction_weight": interaction_weight,
                "pre_sentiment": e.get("sentiment", "neutral"),
                "pre_sentiment_score": float(e.get("sentiment_score") or 0),
                "pre_is_advertorial": bool(e.get("is_advertorial", False)),
                "pre_ad_confidence": float(e.get("ad_confidence") or 0),
                "pre_summary": str(e.get("summary") or "")[:80],
                "pre_keywords": [str(k)[:30] for k in (e.get("keywords") or [])[:5]],
                "raw_data": {"board": board_name, "extracted_idx": idx},
            })
        return records


# ── 軌道 2：Google News + 社群關鍵字（撈被新聞引用的社群熱議） ──

SOCIAL_NEWS_QUERIES = [
    "Dcard 醫美 心得",
    "PTT 整形 評價",
    "Dcard 整形 經驗",
    "Mobile01 醫美",
    "醫美 鄉民 評論",
]


class SocialNewsMentionsCrawler(MentionCrawler):
    """Google News 抓社群類關鍵字（替代 Dcard / Mobile01 直爬）"""
    source_type = "social"   # 注意：歸類為 social 而非 news
    needs_review = False

    async def fetch(self) -> Iterable[RawMention]:
        # 直接重用 NewsMentionsCrawler 的 RSS 邏輯
        from crawlers.news_mentions import NewsMentionsCrawler
        helper = NewsMentionsCrawler(queries=SOCIAL_NEWS_QUERIES, max_items_per_query=20)
        # helper 產出的 source_type='news' 要改寫為 'social'
        results = list(await helper.fetch())
        for r in results:
            r["source_type"] = "social"
            r["interaction_weight"] = 0.7  # 部落格類權重
        return results


# ── 統一入口 ─────────────────────────────────────────────────────────

async def run_social_crawlers() -> dict:
    results = {}
    for code, crawler in [
        ("ptt_rss", PTTRSSCrawler()),
        ("social_news", SocialNewsMentionsCrawler()),
    ]:
        print(f"\n=== Running {code} ===")
        try:
            stats = await crawler.run()
            results[code] = stats
            print(f"[{code}] {stats}")
        except Exception as e:
            results[code] = {"error": str(e)}
            print(f"[{code}] FAILED: {e}")
    return results


if __name__ == "__main__":
    print(asyncio.run(run_social_crawlers()))
