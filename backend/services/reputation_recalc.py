"""reputation_scores 快照計算服務

每次處分爬蟲跑完後呼叫，對所有有處分的診所重算 penalty_score
並寫一筆 (snapshot_date=today) 到 reputation_scores 表。

未來 P3-B/C 完成後，這裡也會一併更新 news_score / social_score。
"""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import desc, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from database import AsyncSessionLocal
from models.admin_penalty import AdminPenalty
from models.reputation_score import ReputationScore
from services.penalty_severity import calc_penalty_score


async def recalc_penalty_scores() -> dict:
    """
    對所有 active penalty 涉及的診所，重算 penalty_score 並寫入 reputation_scores
    回傳統計：{ "clinics_processed": N, "snapshots_written": N }
    """
    today = date.today()
    cutoff_5y = today - timedelta(days=365 * 5)

    async with AsyncSessionLocal() as session:
        # 取所有 active 處分（含 5+ 年的重大）
        stmt = select(AdminPenalty).where(AdminPenalty.status == "active").order_by(desc(AdminPenalty.penalty_date))
        all_penalties = (await session.execute(stmt)).scalars().all()

        # 依 target_id 分組
        by_clinic: dict[str, list[dict]] = {}
        for p in all_penalties:
            # 5+ 年且非重大不計入
            if p.penalty_date < cutoff_5y and not p.is_major:
                continue
            by_clinic.setdefault(p.target_id, []).append({
                "severity": p.severity,
                "is_major": p.is_major,
                "penalty_date": p.penalty_date.isoformat(),
            })

        snapshots_written = 0
        for clinic_id, penalty_list in by_clinic.items():
            score = calc_penalty_score(penalty_list)

            # 統計各嚴重度
            severe_n = sum(1 for p in penalty_list if p["severity"] == "severe")
            medium_n = sum(1 for p in penalty_list if p["severity"] == "medium")
            minor_n = sum(1 for p in penalty_list if p["severity"] == "minor")

            stmt = (
                pg_insert(ReputationScore)
                .values(
                    target_type="clinic",
                    target_id=clinic_id,
                    snapshot_date=today,
                    penalty_score=score,
                    penalty_count_severe=severe_n,
                    penalty_count_medium=medium_n,
                    penalty_count_minor=minor_n,
                )
                .on_conflict_do_update(
                    index_elements=["target_type", "target_id", "snapshot_date"],
                    set_={
                        "penalty_score": score,
                        "penalty_count_severe": severe_n,
                        "penalty_count_medium": medium_n,
                        "penalty_count_minor": minor_n,
                    },
                )
            )
            await session.execute(stmt)
            snapshots_written += 1

        await session.commit()

    return {
        "clinics_processed": len(by_clinic),
        "snapshots_written": snapshots_written,
        "snapshot_date": today.isoformat(),
    }
