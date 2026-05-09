from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class PenaltyClinicResponse(Base):
    """診所對行政處分的改善說明 / 申訴回應（≤200 字）"""
    __tablename__ = "penalty_clinic_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    penalty_id: Mapped[int] = mapped_column(Integer, ForeignKey("admin_penalties.id", ondelete="CASCADE"), index=True)
    clinic_id: Mapped[str] = mapped_column(Text, ForeignKey("clinics.id", ondelete="CASCADE"))

    response_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default='pending')  # pending / approved / rejected

    reviewed_by: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
