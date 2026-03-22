from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Text, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base

class Clinic(Base):
    __tablename__ = "clinics"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    address: Mapped[str | None] = mapped_column(String(500))
    phone: Mapped[str | None] = mapped_column(String(50))
    specialty: Mapped[str | None] = mapped_column(String(200))
    website: Mapped[str | None] = mapped_column(String(500))
    cont_start: Mapped[str | None] = mapped_column(String(20))
    is_partner: Mapped[bool] = mapped_column(Boolean, default=False)
    custom_note: Mapped[str | None] = mapped_column(Text)

    # Google Places
    google_rating: Mapped[float | None] = mapped_column(Float)
    google_review_count: Mapped[int | None] = mapped_column(Integer)
    google_place_id: Mapped[str | None] = mapped_column(String(200))

    # 評分
    score: Mapped[float | None] = mapped_column(Float)
    legal_score: Mapped[float | None] = mapped_column(Float)
    judicial_score: Mapped[float | None] = mapped_column(Float)
    google_rating_score: Mapped[float | None] = mapped_column(Float)
    score_breakdown: Mapped[dict | None] = mapped_column(JSON)
    dispute_count: Mapped[int | None] = mapped_column(Integer)
    treatments: Mapped[list | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
