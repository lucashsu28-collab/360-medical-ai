from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database import get_db

router = APIRouter(prefix="/api/clinics", tags=["clinics"])


@router.get("/{clinic_id}/reviews")
async def get_clinic_reviews(clinic_id: str, db: AsyncSession = Depends(get_db)):
    """取得診所的 Google 評論（最多5則，依時間降冪）"""
    result = await db.execute(
        text("""
            SELECT author_name, rating, text, relative_time
            FROM clinic_reviews
            WHERE clinic_id = :clinic_id
            ORDER BY time DESC
            LIMIT 5
        """),
        {"clinic_id": clinic_id},
    )
    rows = result.fetchall()
    return [
        {
            "author_name": r[0],
            "rating": r[1],
            "text": r[2],
            "relative_time": r[3],
        }
        for r in rows
    ]
