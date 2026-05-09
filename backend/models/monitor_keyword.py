from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class MonitorKeyword(Base):
    """口碑監測關鍵字 — Admin 後台可自訂全平台或單一診所監測詞"""
    __tablename__ = "monitor_keywords"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(String(20), default='global')  # global / clinic
    clinic_id: Mapped[str | None] = mapped_column(Text, ForeignKey("clinics.id", ondelete="CASCADE"), index=True)
    keyword: Mapped[str] = mapped_column(String(200), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
