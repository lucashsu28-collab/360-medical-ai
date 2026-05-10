"""醫美快訊 API（公開查詢 + Admin 觸發/管理）"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from sqlalchemy import desc, func, select, text

from database import AsyncSessionLocal
from models.industry_news import IndustryNews


# 公開：/api/news
public_router = APIRouter(prefix="/api/news", tags=["industry-news-public"])


def _serialize(n: IndustryNews) -> dict[str, Any]:
    return {
        "id": n.id,
        "source_url": n.source_url,
        "source_name": n.source_name,
        "category": n.category,
        "title": n.title,
        "summary": n.summary,
        "cover_image": n.cover_image,
        "published_at": n.published_at.isoformat() if n.published_at else None,
        "ai_keywords": n.ai_keywords or [],
    }


@public_router.get("")
async def list_news(
    category: str | None = None,
    limit: int = Query(40, le=200),
    offset: int = 0,
):
    """公開列表，依 published_at 降冪"""
    async with AsyncSessionLocal() as session:
        stmt = select(IndustryNews).where(IndustryNews.status == "active")
        if category:
            stmt = stmt.where(IndustryNews.category == category)
        count_stmt = stmt.with_only_columns(func.count(IndustryNews.id))
        total = (await session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(desc(IndustryNews.published_at).nullslast(), desc(IndustryNews.crawled_at)).offset(offset).limit(limit)
        rows = (await session.execute(stmt)).scalars().all()
        return {"total": total, "items": [_serialize(n) for n in rows]}


# Admin：/api/admin/news
admin_router = APIRouter(prefix="/api/admin/news", tags=["industry-news-admin"])


@admin_router.get("")
async def admin_list(
    status: str | None = None,
    category: str | None = None,
    limit: int = Query(50, le=500),
    offset: int = 0,
):
    async with AsyncSessionLocal() as session:
        stmt = select(IndustryNews)
        if status:
            stmt = stmt.where(IndustryNews.status == status)
        if category:
            stmt = stmt.where(IndustryNews.category == category)
        total = (await session.execute(stmt.with_only_columns(func.count(IndustryNews.id)))).scalar_one()
        stmt = stmt.order_by(desc(IndustryNews.published_at).nullslast()).offset(offset).limit(limit)
        rows = (await session.execute(stmt)).scalars().all()
        return {"total": total, "items": [_serialize(n) for n in rows]}


@admin_router.get("/stats")
async def admin_stats():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT
                COUNT(*) FILTER (WHERE status = 'active') AS active,
                COUNT(*) FILTER (WHERE status = 'hidden') AS hidden,
                COUNT(*) FILTER (WHERE category = 'domestic') AS domestic,
                COUNT(*) FILTER (WHERE category = 'korea') AS korea,
                COUNT(*) FILTER (WHERE category = 'international') AS international,
                COUNT(*) FILTER (WHERE category = 'tech') AS tech
            FROM industry_news
        """))
        row = result.first()
        return {
            "active": row[0] or 0, "hidden": row[1] or 0,
            "domestic": row[2] or 0, "korea": row[3] or 0,
            "international": row[4] or 0, "tech": row[5] or 0,
        }


@admin_router.patch("/{news_id}")
async def admin_update(news_id: int, body: dict):
    allowed = {"status", "category", "summary", "title"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates:
        raise HTTPException(400, "no valid fields")
    async with AsyncSessionLocal() as session:
        n = await session.get(IndustryNews, news_id)
        if not n:
            raise HTTPException(404, "not found")
        for k, v in updates.items():
            setattr(n, k, v)
        await session.commit()
        return {"ok": True, "updated": updates}


@admin_router.delete("/{news_id}")
async def admin_hide(news_id: int):
    async with AsyncSessionLocal() as session:
        n = await session.get(IndustryNews, news_id)
        if not n:
            raise HTTPException(404, "not found")
        n.status = "hidden"
        await session.commit()
        return {"ok": True}


async def _run_news_background():
    from crawlers.industry_news import run_industry_news_crawler
    try:
        stats = await run_industry_news_crawler()
        print(f"[admin trigger] industry_news crawler done: {stats}")
    except Exception as e:
        print(f"[admin trigger] industry_news failed: {e}")
        import traceback
        traceback.print_exc()


@admin_router.post("/run-crawler")
async def admin_run_crawler(background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_news_background)
    return {"ok": True, "message": "醫美快訊爬蟲已啟動，5-10 分鐘後可看結果"}


async def _backfill_covers_background():
    """補抓既有資料中 cover_image 為 NULL 的封面"""
    import httpx
    from crawlers.industry_news import extract_cover
    from sqlalchemy import update
    from models.industry_news import IndustryNews

    async with AsyncSessionLocal() as session, httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        rows = (await session.execute(
            select(IndustryNews).where(
                IndustryNews.cover_image.is_(None),
                IndustryNews.status == "active",
            ).limit(60)
        )).scalars().all()
        print(f"[backfill_covers] processing {len(rows)} rows")
        ok = 0
        for n in rows:
            cover = await extract_cover(client, n.source_url)
            if cover:
                n.cover_image = cover
                ok += 1
        await session.commit()
        print(f"[backfill_covers] backfilled {ok}/{len(rows)}")


@admin_router.post("/backfill-covers")
async def admin_backfill_covers(background_tasks: BackgroundTasks):
    """補抓既有 0 cover 新聞的封面（背景跑）"""
    background_tasks.add_task(_backfill_covers_background)
    return {"ok": True, "message": "補抓封面已啟動（一次處理 60 筆，可重複觸發）"}


@admin_router.get("/debug-cover")
async def admin_debug_cover(url: str):
    """Debug：對指定 URL 跑 extract_cover，回診斷資訊"""
    import httpx, re
    from crawlers.industry_news import extract_cover, _BROWSER_HEADERS

    debug = {"input": url}
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            cover = await extract_cover(client, url)
            debug["cover_result"] = cover
            # 額外抓一次原始 HTML 看 Cloud Run 環境拿到什麼
            resp = await client.get(url, headers=_BROWSER_HEADERS)
            debug["status"] = resp.status_code
            debug["content_length"] = len(resp.content)
            debug["final_url"] = str(resp.url)
            # 找 lh3.googleusercontent.com 連結
            matches = re.findall(rb'lh3\.googleusercontent\.com/[A-Za-z0-9_\-]+=(?:[sw][0-9][^"\'\s<>]*)', resp.content)
            debug["gnews_thumb_count"] = len(matches)
            debug["gnews_thumb_sample"] = [m.decode("utf-8", errors="ignore")[:120] for m in matches[:5]]
    except Exception as e:
        debug["error"] = str(e)
    return debug
