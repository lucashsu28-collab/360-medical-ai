"""醫美快訊爬蟲（行業新聞 + 國內外新知）

策略：
  Google News RSS 抓 4 大類關鍵字 → Gemini 為每篇摘要 + 分類 + 抽關鍵字
  寫入 industry_news 表（去重靠 source_url unique）

Category：
  domestic（國內醫美新聞）
  korea（韓國醫美趨勢）
  international（國際醫美新知）
  tech（醫美新技術）
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
from sqlalchemy.dialects.postgresql import insert as pg_insert

from config import GEMINI_API_KEY
from database import AsyncSessionLocal
from models.industry_news import IndustryNews


GOOGLE_NEWS_RSS = "https://news.google.com/rss/search"
RSS_PARAMS = {"hl": "zh-TW", "gl": "TW", "ceid": "TW:zh-Hant"}


# 4 大類查詢，category 直接綁定
QUERIES = [
    ("domestic", "醫美 新聞"),
    ("domestic", "醫美 趨勢 台灣"),
    ("domestic", "醫美 法規"),
    ("korea", "韓國 醫美"),
    ("korea", "韓國 整形 技術"),
    ("international", "醫美 國際 新技術"),
    ("international", "aesthetic medicine"),
    ("tech", "醫美 雷射 新技術"),
    ("tech", "FDA 醫美 設備"),
    ("tech", "皮膚 抗老 突破"),
]


def _strip_html(text: str) -> str:
    """剝除 HTML tag、unescape entities、合併空白；對未閉合 tag 也容錯"""
    if not text:
        return ""
    # 1. 清完整 tag <xxx>
    text = re.sub(r"<[^>]+>", " ", text)
    # 2. 容錯：清掉開放但沒閉合的 tag（如被截斷成 `<a href="...`）
    text = re.sub(r"<[a-zA-Z/][^\s<>]*", " ", text)
    # 3. 清掉殘留的 < 或 > 單字元
    text = text.replace("<", " ").replace(">", " ")
    # 4. unescape 常見 entities
    text = (text
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", '"')
            .replace("&#39;", "'"))
    return re.sub(r"\s+", " ", text).strip()


_SUMMARIZE_PROMPT = """從下列醫美相關新聞，產出一份 JSON 物件：
- summary: 用 80 字內中文摘要核心內容
- keywords: 字串陣列（最多 5 個關鍵字，醫美相關）
- skip: 布林，是否與醫美/整形/皮膚科/抗老 無關（廣告稿、無關內容、純股票財報 → true）

文章標題：{title}
文章描述：{description}

只輸出 JSON 物件，不要 markdown code fence。
"""


def summarize_news(title: str, description: str) -> dict:
    """Gemini 摘要 + 過濾無關"""
    clean_d = _strip_html(description or "")
    DEFAULT = {"summary": (clean_d[:80] if clean_d else title[:80]), "keywords": [], "skip": False}
    if not GEMINI_API_KEY:
        return DEFAULT
    if not title:
        return DEFAULT

    text_d = clean_d[:1000]

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[_SUMMARIZE_PROMPT.format(title=title, description=text_d)],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=400,
                temperature=0.1,
            ),
        )
        raw = (response.text or "").strip()
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
        data = json.loads(raw)
        if not isinstance(data, dict):
            return DEFAULT
        # 後處理
        data["summary"] = str(data.get("summary") or "")[:120]
        kws = data.get("keywords") or []
        data["keywords"] = [str(k)[:30] for k in kws[:5]] if isinstance(kws, list) else []
        data["skip"] = bool(data.get("skip", False))
        return data
    except Exception as e:
        print(f"[industry_news] summarize error: {e}")
        return DEFAULT


def parse_rss(content: bytes) -> list[dict]:
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
            "title": title, "link": link, "pub_date": pub_date,
            "description": description, "source_name": source_name,
        })
    return items


def parse_pub_date(s: str) -> datetime | None:
    if not s:
        return None
    from email.utils import parsedate_to_datetime
    try:
        return parsedate_to_datetime(s).replace(tzinfo=None)
    except (TypeError, ValueError):
        return None


async def _resolve_real_url(client: httpx.AsyncClient, gnews_url: str) -> str | None:
    """用 googlenewsdecoder 套件解 Google News URL → 真實媒體 article URL"""
    if "news.google.com" not in gnews_url:
        return gnews_url
    try:
        from googlenewsdecoder import gnewsdecoder
        # interval=0 不 sleep（套件預設 sleep 避免被 Google ban，但我們批次處理本身已有 1s sleep）
        result = await asyncio.to_thread(gnewsdecoder, gnews_url, interval=0)
        if result and result.get("status") and result.get("decoded_url"):
            return result["decoded_url"]
    except Exception as e:
        print(f"[industry_news] googlenewsdecoder failed: {e}")
    return None


_BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
}


# Google News default logo（每篇都是同一張，要過濾）
_GNEWS_LOGO_ID = "J6_coFbogxhRI9iM864NL_liGXvsQp2AupsKei7z0cNNfDvGUmWUy20nuUhkREQyrpY4bEeIBuc"


async def extract_cover(client: httpx.AsyncClient, url: str) -> str | None:
    """抓封面：先 resolve Google News redirect 到原文 → 抓 og:image（最穩，每篇不同）"""
    if not url:
        return None

    real = await _resolve_real_url(client, url) if "news.google.com" in url else url
    if not real or "news.google.com" in real:
        # resolve 失敗（仍是 google news URL）
        return None

    try:
        resp = await client.get(real, timeout=10.0, follow_redirects=True, headers=_BROWSER_HEADERS)
        if resp.status_code != 200:
            return None
        body = resp.content[:120000]
        # og:image / og:image:secure_url
        m = re.search(rb'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)["\']', body)
        if not m:
            m = re.search(rb'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', body)
        if m:
            cover = m.group(1).decode("utf-8", errors="ignore")
            if _GNEWS_LOGO_ID not in cover:
                return cover
        # twitter:image
        m = re.search(rb'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']', body)
        if m:
            cover = m.group(1).decode("utf-8", errors="ignore")
            if _GNEWS_LOGO_ID not in cover:
                return cover
    except Exception as e:
        print(f"[industry_news] og:image error: {e}")
    return None


async def run_industry_news_crawler(max_per_query: int = 15, fetch_cover: bool = True) -> dict:
    """跑全部 4 類關鍵字，寫入 industry_news"""
    stats = {"fetched": 0, "summarized": 0, "skipped": 0, "inserted": 0}

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client, AsyncSessionLocal() as session:
        for category, query in QUERIES:
            try:
                url = f"{GOOGLE_NEWS_RSS}?q={quote(query)}&hl={RSS_PARAMS['hl']}&gl={RSS_PARAMS['gl']}&ceid={RSS_PARAMS['ceid']}"
                resp = await client.get(url)
                resp.raise_for_status()
                items = parse_rss(resp.content)[:max_per_query]
                stats["fetched"] += len(items)
                print(f"[industry_news] {category} '{query}' → {len(items)} items")

                for it in items:
                    if not it["link"] or not it["title"]:
                        continue

                    # 摘要 + 過濾
                    s = summarize_news(it["title"], it["description"])
                    stats["summarized"] += 1
                    if s.get("skip"):
                        stats["skipped"] += 1
                        continue

                    cover = None
                    if fetch_cover:
                        cover = await extract_cover(client, it["link"])

                    stmt = (
                        pg_insert(IndustryNews)
                        .values(
                            source_url=it["link"],
                            source_name=it.get("source_name") or None,
                            category=category,
                            title=it["title"][:500],
                            summary=s.get("summary"),
                            cover_image=cover,
                            published_at=parse_pub_date(it.get("pub_date") or ""),
                            ai_keywords=s.get("keywords", []),
                            status="active",
                        )
                        .on_conflict_do_nothing(index_elements=["source_url"])
                    )
                    result = await session.execute(stmt)
                    if result.rowcount and result.rowcount > 0:
                        stats["inserted"] += 1

                await session.commit()
                await asyncio.sleep(1.0)

            except Exception as e:
                print(f"[industry_news] {category} '{query}' failed: {e}")
                continue

    return stats


if __name__ == "__main__":
    print(asyncio.run(run_industry_news_crawler()))
