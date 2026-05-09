from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class Mention(Base):
    """口碑提及 — P3-B 網路媒體 + P3-C 社群共用表"""
    __tablename__ = "mentions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    target_type: Mapped[str] = mapped_column(String(10), nullable=False)  # clinic / doctor
    target_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)

    source_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # news / dcard / ptt / mobile01 / blog
    source_name: Mapped[str | None] = mapped_column(String(100))  # ETtoday / Dcard美容板 ...
    source_url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)

    title: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str | None] = mapped_column(Text)
    author: Mapped[str | None] = mapped_column(String(100))
    published_at: Mapped[datetime | None] = mapped_column(DateTime, index=True)

    # Gemini 分析結果
    sentiment: Mapped[str | None] = mapped_column(String(10), index=True)  # positive / neutral / negative
    sentiment_score: Mapped[float | None] = mapped_column(Float)  # -1.0 ~ +1.0

    # 評分因子
    authority_weight: Mapped[float] = mapped_column(Float, default=1.0)  # 媒體權威度 / 平台權重
    interaction_likes: Mapped[int] = mapped_column(Integer, default=0)
    interaction_comments: Mapped[int] = mapped_column(Integer, default=0)
    interaction_dislikes: Mapped[int] = mapped_column(Integer, default=0)
    interaction_weight: Mapped[float] = mapped_column(Float, default=1.0)

    is_advertorial: Mapped[bool] = mapped_column(Boolean, default=False)
    ad_confidence: Mapped[float | None] = mapped_column(Float)

    ai_summary: Mapped[str | None] = mapped_column(Text)
    keywords: Mapped[list | None] = mapped_column(JSON, default=list)

    contribution_score: Mapped[float | None] = mapped_column(Float)  # 該則對總分的貢獻

    status: Mapped[str] = mapped_column(String(20), default='active')  # active / hidden / pending
    crawled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
