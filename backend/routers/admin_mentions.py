"""Admin /api/admin/mentions — 口碑提及管理介面後端"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from sqlalchemy import desc, func, select, text

from database import AsyncSessionLocal
from models.clinic import Clinic
from models.mention import Mention


router = APIRouter(prefix="/api/admin/mentions", tags=["admin-mentions"])


def _serialize(m: Mention, clinic_name: str | None = None) -> dict[str, Any]:
    return {
        "id": m.id,
        "target_id": m.target_id,
        "clinic_name": clinic_name,
        "source_type": m.source_type,
        "source_name": m.source_name,
        "source_url": m.source_url,
        "title": m.title,
        "content": (m.content or "")[:500],
        "author": m.author,
        "published_at": m.published_at.isoformat() if m.published_at else None,
        "sentiment": m.sentiment,
        "sentiment_score": m.sentiment_score,
        "authority_weight": m.authority_weight,
        "interaction_likes": m.interaction_likes,
        "interaction_comments": m.interaction_comments,
        "is_advertorial": m.is_advertorial,
        "ad_confidence": m.ad_confidence,
        "ai_summary": m.ai_summary,
        "keywords": m.keywords,
        "contribution_score": m.contribution_score,
        "status": m.status,
        "crawled_at": m.crawled_at.isoformat() if m.crawled_at else None,
    }


@router.get("")
async def list_mentions(
    status: str | None = None,
    sentiment: str | None = None,
    clinic_id: str | None = None,
    is_advertorial: bool | None = None,
    limit: int = Query(50, le=500),
    offset: int = 0,
):
    async with AsyncSessionLocal() as session:
        stmt = select(Mention, Clinic.name).join(
            Clinic, Mention.target_id == Clinic.id, isouter=True
        ).where(Mention.source_type == "news")  # 只看新聞媒體；社群維度已下線
        if status:
            stmt = stmt.where(Mention.status == status)
        if sentiment:
            stmt = stmt.where(Mention.sentiment == sentiment)
        if clinic_id:
            stmt = stmt.where(Mention.target_id == clinic_id)
        if is_advertorial is not None:
            stmt = stmt.where(Mention.is_advertorial == is_advertorial)

        count_stmt = stmt.with_only_columns(func.count(Mention.id))
        total = (await session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(desc(Mention.published_at)).offset(offset).limit(limit)
        rows = (await session.execute(stmt)).all()

        return {
            "total": total,
            "items": [_serialize(m, name) for m, name in rows],
        }


@router.get("/raw-count")
async def get_raw_count():
    """Debug 用：不過濾 source_type 的全表計數"""
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT
                COUNT(*) AS total,
                COUNT(DISTINCT source_type) AS source_types,
                MIN(crawled_at) AS earliest,
                MAX(crawled_at) AS latest
            FROM mentions
        """))
        row = result.first()
        breakdown = await session.execute(text("""
            SELECT source_type, status, COUNT(*) AS cnt
            FROM mentions
            GROUP BY source_type, status
            ORDER BY cnt DESC
        """))
        return {
            "total": row[0] or 0,
            "source_types": row[1] or 0,
            "earliest": row[2].isoformat() if row[2] else None,
            "latest": row[3].isoformat() if row[3] else None,
            "breakdown": [
                {"source_type": r[0], "status": r[1], "count": r[2]}
                for r in breakdown.all()
            ],
        }


@router.get("/stats")
async def get_stats():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT
                COUNT(*) FILTER (WHERE status = 'active') AS active,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE status = 'hidden') AS hidden,
                COUNT(*) FILTER (WHERE sentiment = 'positive') AS positive,
                COUNT(*) FILTER (WHERE sentiment = 'neutral') AS neutral,
                COUNT(*) FILTER (WHERE sentiment = 'negative') AS negative,
                COUNT(*) FILTER (WHERE is_advertorial = TRUE) AS advertorial,
                COUNT(DISTINCT target_id) FILTER (WHERE status = 'active') AS clinics_covered
            FROM mentions
            WHERE source_type = 'news'
        """))
        row = result.first()
        return {
            "active": row[0] or 0,
            "pending": row[1] or 0,
            "hidden": row[2] or 0,
            "positive": row[3] or 0,
            "neutral": row[4] or 0,
            "negative": row[5] or 0,
            "advertorial": row[6] or 0,
            "clinics_covered": row[7] or 0,
        }


@router.get("/{mention_id}")
async def get_mention(mention_id: int):
    async with AsyncSessionLocal() as session:
        stmt = select(Mention, Clinic.name).join(
            Clinic, Mention.target_id == Clinic.id, isouter=True
        ).where(Mention.id == mention_id)
        row = (await session.execute(stmt)).first()
        if not row:
            raise HTTPException(404, "mention not found")
        m, name = row
        out = _serialize(m, name)
        out["content"] = m.content  # 詳情頁給完整內容
        return out


@router.patch("/{mention_id}")
async def update_mention(mention_id: int, body: dict[str, Any]):
    """允許修改 status / sentiment / is_advertorial"""
    allowed = {"status", "sentiment", "sentiment_score", "is_advertorial", "ad_confidence"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates:
        raise HTTPException(400, "no valid fields to update")

    async with AsyncSessionLocal() as session:
        m = await session.get(Mention, mention_id)
        if not m:
            raise HTTPException(404, "mention not found")
        for k, v in updates.items():
            setattr(m, k, v)
        await session.commit()
        return {"ok": True, "updated": updates}


@router.delete("/{mention_id}")
async def hide_mention(mention_id: int):
    async with AsyncSessionLocal() as session:
        m = await session.get(Mention, mention_id)
        if not m:
            raise HTTPException(404, "mention not found")
        m.status = "hidden"
        await session.commit()
        return {"ok": True}


# ──────────────────────────────────────────────────────────────────
# 觸發爬蟲
# ──────────────────────────────────────────────────────────────────


async def _run_news_mentions_background():
    from crawlers.news_mentions import run_news_mentions_crawler
    try:
        stats = await run_news_mentions_crawler()
        print(f"[admin trigger] news mentions crawler done: {stats}")
    except Exception as e:
        print(f"[admin trigger] news mentions crawler failed: {e}")
        import traceback
        traceback.print_exc()


@router.post("/run-crawler")
async def run_crawler(background_tasks: BackgroundTasks, source: str = "news"):
    """觸發網路媒體口碑爬蟲（社群維度已下線）"""
    if source != "news":
        raise HTTPException(400, "僅支援 source=news（社群維度已下線）")
    background_tasks.add_task(_run_news_mentions_background)
    return {
        "ok": True,
        "message": "新聞口碑爬蟲已啟動，5-10 分鐘後可看結果",
        "source": "news",
    }
