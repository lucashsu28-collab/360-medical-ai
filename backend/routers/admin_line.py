"""P2-5: Admin LINE OA 數據儀表板 API"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, timedelta

from database import get_db

router = APIRouter(prefix="/admin/line", tags=["admin-line"])


@router.get("/stats")
async def get_line_stats(db: AsyncSession = Depends(get_db)):
    try:
        r1 = await db.execute(
            text("""
                SELECT COUNT(DISTINCT user_id)
                FROM line_conversation_stats
                WHERE created_at > NOW() - INTERVAL '30 days'
            """)
        )
        r2 = await db.execute(
            text("""
                SELECT COUNT(*)
                FROM line_conversation_stats
                WHERE created_at > NOW() - INTERVAL '30 days'
            """)
        )
        r3 = await db.execute(
            text("""
                SELECT COUNT(*)
                FROM line_conversation_stats
                WHERE created_at > NOW() - INTERVAL '30 days'
                AND converted = TRUE
            """)
        )

        total_users = r1.scalar() or 0
        total_messages = r2.scalar() or 0
        total_converted = r3.scalar() or 0
        conversion_rate = round(total_converted / total_messages * 100, 1) if total_messages > 0 else 0.0

        # 近14天每日統計
        r4 = await db.execute(
            text("""
                SELECT DATE(created_at) AS day, COUNT(*) AS cnt
                FROM line_conversation_stats
                WHERE created_at > NOW() - INTERVAL '14 days'
                GROUP BY day
                ORDER BY day ASC
            """)
        )
        daily_rows = r4.fetchall()
        daily_trend = [{"date": str(r[0]), "count": r[1]} for r in daily_rows]

        return {
            "total_users_30d": total_users,
            "total_messages_30d": total_messages,
            "total_converted_30d": total_converted,
            "conversion_rate": conversion_rate,
            "daily_trend": daily_trend,
        }
    except Exception as e:
        print(f"[admin_line] stats error: {e}")
        return {
            "total_users_30d": 0,
            "total_messages_30d": 0,
            "total_converted_30d": 0,
            "conversion_rate": 0.0,
            "daily_trend": [],
        }


@router.get("/popular-questions")
async def get_popular_questions(db: AsyncSession = Depends(get_db)):
    try:
        r = await db.execute(
            text("""
                SELECT question_text, count, last_seen
                FROM line_popular_questions
                ORDER BY count DESC
                LIMIT 10
            """)
        )
        rows = r.fetchall()
        return [{"question_text": r[0], "count": r[1], "last_seen": str(r[2])} for r in rows]
    except Exception as e:
        print(f"[admin_line] popular questions error: {e}")
        return []


@router.get("/clinic-conversions")
async def get_clinic_conversions(db: AsyncSession = Depends(get_db)):
    try:
        r = await db.execute(
            text("""
                SELECT s.clinic_id, c.name AS clinic_name, COUNT(*) AS converted_count
                FROM line_conversation_stats s
                JOIN clinics c ON s.clinic_id = c.id
                WHERE s.converted = TRUE
                AND s.created_at > NOW() - INTERVAL '30 days'
                GROUP BY s.clinic_id, c.name
                ORDER BY converted_count DESC
                LIMIT 20
            """)
        )
        rows = r.fetchall()
        return [{"clinic_id": r[0], "clinic_name": r[1], "converted_count": r[2]} for r in rows]
    except Exception as e:
        print(f"[admin_line] clinic conversions error: {e}")
        return []
