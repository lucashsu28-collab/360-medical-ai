from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database import get_db

router = APIRouter(prefix="/api/clinics", tags=["clinics"])

CITY_VARIANTS = {
    "台北市": ["台北市", "臺北市"],
    "新北市": ["新北市"],
    "基隆市": ["基隆市"],
    "桃園市": ["桃園市"],
    "新竹市": ["新竹市"],
    "新竹縣": ["新竹縣"],
    "苗栗縣": ["苗栗縣"],
    "台中市": ["台中市", "臺中市"],
    "彰化縣": ["彰化縣"],
    "南投縣": ["南投縣"],
    "雲林縣": ["雲林縣"],
    "嘉義市": ["嘉義市"],
    "嘉義縣": ["嘉義縣"],
    "台南市": ["台南市", "臺南市"],
    "高雄市": ["高雄市"],
    "屏東縣": ["屏東縣"],
    "宜蘭縣": ["宜蘭縣"],
    "花蓮縣": ["花蓮縣"],
    "台東縣": ["台東縣", "臺東縣"],
    "澎湖縣": ["澎湖縣"],
    "金門縣": ["金門縣"],
    "連江縣": ["連江縣"],
}

CITY_ORDER = list(CITY_VARIANTS.keys())


@router.get("/by-city")
async def get_clinics_by_city(db: AsyncSession = Depends(get_db)):
    """取得依縣市分組的診所列表，合作診所優先排前。"""
    result = await db.execute(
        text("""
            SELECT id, name, address, score, google_rating,
                   google_review_count, is_partner, specialty, line_oa_url
            FROM clinics
            ORDER BY is_partner DESC NULLS LAST, score DESC NULLS LAST
        """)
    )
    rows = result.fetchall()

    by_city: dict[str, list] = {city: [] for city in CITY_ORDER}
    by_city["其他"] = []

    for row in rows:
        addr = row[2] or ""
        assigned = False
        for canonical, variants in CITY_VARIANTS.items():
            if any(addr.startswith(v) for v in variants):
                by_city[canonical].append({
                    "id": row[0], "name": row[1], "address": row[2],
                    "score": row[3], "google_rating": row[4],
                    "google_review_count": row[5], "isPartner": row[6],
                    "specialty": row[7], "line_oa_url": row[8],
                })
                assigned = True
                break
        if not assigned:
            by_city["其他"].append({
                "id": row[0], "name": row[1], "address": row[2],
                "score": row[3], "google_rating": row[4],
                "google_review_count": row[5], "isPartner": row[6],
                "specialty": row[7], "line_oa_url": row[8],
            })

    # 移除空縣市
    return {city: clinics for city, clinics in by_city.items() if clinics}


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
