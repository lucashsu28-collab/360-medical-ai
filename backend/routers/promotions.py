"""P2-2: 優惠療程搜尋 API"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database import get_db

router = APIRouter(prefix="/promotions", tags=["promotions"])

CATEGORIES = ["微整形", "雷射", "保養", "手術"]
PARTS = ["臉部", "眼部", "鼻部", "身體"]
EFFECTS = ["除皺", "美白", "縮毛孔", "拉提"]
PRICE_RANGES = ["$3,000以下", "$3,000-$10,000", "$10,000以上"]


@router.get("/categories")
async def get_categories():
    return {
        "by_category": CATEGORIES,
        "by_part": PARTS,
        "by_effect": EFFECTS,
        "by_price": PRICE_RANGES,
    }


@router.get("")
async def get_promotions(
    category: str = Query(""),
    part: str = Query(""),
    effect: str = Query(""),
    price_range: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    where_clauses = ["p.is_active = TRUE"]
    params: dict = {}

    if category:
        where_clauses.append("p.treatment_category = :category")
        params["category"] = category
    if part:
        where_clauses.append("p.treatment_part = :part")
        params["part"] = part
    if effect:
        where_clauses.append("p.treatment_effect = :effect")
        params["effect"] = effect
    if price_range == "$3,000以下":
        where_clauses.append("(p.price_max <= 3000 OR p.price_max IS NULL)")
    elif price_range == "$3,000-$10,000":
        where_clauses.append("(p.price_min <= 10000 AND p.price_max >= 3000)")
    elif price_range == "$10,000以上":
        where_clauses.append("(p.price_min >= 10000)")

    where_sql = " AND ".join(where_clauses)

    try:
        result = await db.execute(
            text(f"""
                SELECT p.id, p.clinic_id, p.treatment_name, p.treatment_category,
                       p.treatment_part, p.treatment_effect, p.price_min, p.price_max,
                       p.price_label, p.title, p.description, p.expires_at,
                       c.name AS clinic_name, c.address,
                       c.is_partner, c.line_oa_url, c.google_rating
                FROM promotions p
                JOIN clinics c ON p.clinic_id = c.id
                WHERE {where_sql}
                ORDER BY c.is_partner DESC NULLS LAST, p.expires_at ASC NULLS LAST
            """),
            params,
        )
        rows = result.fetchall()
        promotions = []
        for r in rows:
            addr = r[13] or ""
            city = addr[:3] if len(addr) >= 3 else addr
            district = addr[3:6] if len(addr) >= 6 else ""
            promotions.append({
                "id": r[0], "clinic_id": r[1],
                "treatment_name": r[2], "treatment_category": r[3],
                "treatment_part": r[4], "treatment_effect": r[5],
                "price_min": r[6], "price_max": r[7], "price_label": r[8],
                "title": r[9], "description": r[10],
                "expires_at": str(r[11]) if r[11] else None,
                "clinic_name": r[12], "clinic_city": city,
                "clinic_district": district, "is_partner": r[14],
                "clinic_line_oa_url": r[15], "clinic_google_rating": r[16],
            })
        return {"promotions": promotions, "total": len(promotions)}
    except Exception as e:
        print(f"[promotions] DB error: {e}")
        return {"promotions": [], "total": 0}
