from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class MentionAppeal(Base):
    """口碑申訴 — 診所對單篇 mention 提出異議（業配誤判 / 不實報導 / 已和解等）"""
    __tablename__ = "mention_appeals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mention_id: Mapped[int] = mapped_column(Integer, ForeignKey("mentions.id", ondelete="CASCADE"))
    clinic_id: Mapped[str] = mapped_column(Text, ForeignKey("clinics.id", ondelete="CASCADE"))

    appeal_type: Mapped[str | None] = mapped_column(String(30))  # not_advertorial / false_report / resolved / other
    appeal_text: Mapped[str | None] = mapped_column(Text)
    evidence_urls: Mapped[list | None] = mapped_column(JSON, default=list)

    status: Mapped[str] = mapped_column(String(20), default='pending', index=True)  # pending / approved / rejected
    reviewed_by: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime)
    review_note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
