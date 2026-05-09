"""Public API: 診所聲譽趨勢（30/90 天）"""
from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Query
from sqlalchemy import asc, select

from database import AsyncSessionLocal
from models.reputation_score import ReputationScore


router = APIRouter(tags=["clinic-trend"])


@router.get("/api/clinics/{clinic_id}/reputation/trend")
async def get_reputation_trend(clinic_id: str, days: int = Query(30, ge=7, le=180)):
    """返回近 N 天的 (date, news_score, social_score, penalty_score) 時序資料"""
    today = date.today()
    cutoff = today - timedelta(days=days)

    async with AsyncSessionLocal() as session:
        stmt = select(ReputationScore).where(
            ReputationScore.target_type == "clinic",
            ReputationScore.target_id == clinic_id,
            ReputationScore.snapshot_date >= cutoff,
        ).order_by(asc(ReputationScore.snapshot_date))
        rows = (await session.execute(stmt)).scalars().all()

        points = [
            {
                "date": r.snapshot_date.isoformat(),
                "news_score": r.news_score,
                "social_score": r.social_score,
                "penalty_score": r.penalty_score,
                "mention_count": r.mention_count,
                "positive": r.positive_count,
                "negative": r.negative_count,
            }
            for r in rows
        ]

        return {
            "clinic_id": clinic_id,
            "days": days,
            "points": points,
            "has_data": len(points) > 0,
        }
