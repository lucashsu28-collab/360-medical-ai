from datetime import datetime, date
from sqlalchemy import String, Integer, DateTime, Date, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class ReputationScore(Base):
    """口碑評分每日快照（趨勢圖資料源）"""
    __tablename__ = "reputation_scores"
    __table_args__ = (
        UniqueConstraint("target_type", "target_id", "snapshot_date", name="uq_reputation_target_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    target_type: Mapped[str] = mapped_column(String(10), nullable=False)  # clinic / doctor
    target_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    news_score: Mapped[int | None] = mapped_column(Integer)      # 0-100
    social_score: Mapped[int | None] = mapped_column(Integer)    # 0-100
    penalty_score: Mapped[int | None] = mapped_column(Integer)   # 0-100

    mention_count: Mapped[int] = mapped_column(Integer, default=0)
    positive_count: Mapped[int] = mapped_column(Integer, default=0)
    neutral_count: Mapped[int] = mapped_column(Integer, default=0)
    negative_count: Mapped[int] = mapped_column(Integer, default=0)

    penalty_count_severe: Mapped[int] = mapped_column(Integer, default=0)
    penalty_count_medium: Mapped[int] = mapped_column(Integer, default=0)
    penalty_count_minor: Mapped[int] = mapped_column(Integer, default=0)

    details: Mapped[dict | None] = mapped_column(JSON)  # 計算明細（前台「點擊查看評分依據」用）

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
