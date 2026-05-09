"""Public API: 取診所口碑提及（前台第 5 維度卡用）"""
from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter
from sqlalchemy import desc, select

from database import AsyncSessionLocal
from models.mention import Mention
from services.news_score import calc_grade, calc_news_score


router = APIRouter(tags=["clinic-mentions"])


@router.get("/api/clinics/{clinic_id}/mentions")
async def get_clinic_mentions(clinic_id: str, source_type: str = "news", limit: int = 20):
    """前台公開 API：返回該診所口碑提及與評分"""
    cutoff = datetime.utcnow() - timedelta(days=365)  # 採近 12 個月

    async with AsyncSessionLocal() as session:
        stmt = select(Mention).where(
            Mention.target_type == "clinic",
            Mention.target_id == clinic_id,
            Mention.source_type == source_type,
            Mention.status == "active",
            Mention.published_at >= cutoff,
        ).order_by(desc(Mention.published_at)).limit(limit)
        all_mentions = (await session.execute(stmt)).scalars().all()

    # 計算評分
    score_input = [
        {
            "sentiment_score": m.sentiment_score or 0,
            "authority_weight": m.authority_weight or 1.0,
            "is_advertorial": m.is_advertorial,
            "ad_confidence": m.ad_confidence or 0,
            "published_at": m.published_at,
            "interaction_weight": m.interaction_weight or 1.0,
        }
        for m in all_mentions
    ]
    if source_type == "social":
        from services.news_score import calc_social_score
        score = calc_social_score(score_input)
    else:
        score = calc_news_score(score_input)
    grade_letter, grade_label = calc_grade(score)

    # 統計
    pos_count = sum(1 for m in all_mentions if m.sentiment in ("positive", "positive_strong"))
    neg_count = sum(1 for m in all_mentions if m.sentiment in ("negative", "negative_strong"))
    neu_count = sum(1 for m in all_mentions if m.sentiment == "neutral")
    ad_count = sum(1 for m in all_mentions if m.is_advertorial)

    items = []
    for m in all_mentions:
        items.append({
            "id": m.id,
            "source_name": m.source_name,
            "source_url": m.source_url,
            "title": m.title,
            "ai_summary": m.ai_summary,
            "published_at": m.published_at.isoformat() if m.published_at else None,
            "sentiment": m.sentiment,
            "is_advertorial": m.is_advertorial,
            "keywords": m.keywords,
            "contribution_score": m.contribution_score,
            "authority_weight": m.authority_weight,
        })

    return {
        "clinic_id": clinic_id,
        "source_type": source_type,
        "score": score,
        "grade": grade_letter,
        "grade_label": grade_label,
        "summary": {
            "total": len(all_mentions),
            "positive": pos_count,
            "neutral": neu_count,
            "negative": neg_count,
            "advertorial": ad_count,
            "has_record": len(all_mentions) > 0,
        },
        "mentions": items,
    }
