from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class MediaAuthority(Base):
    """媒體權威度分級表 — 評分公式中的「媒體權威度」因子來源
    A 級 ×1.5 主流 / B 級 ×1.2 網路 / C 級 ×1.0 醫美專業 / D 級 ×0.5 不知名
    """
    __tablename__ = "media_authority"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    domain: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    media_name: Mapped[str | None] = mapped_column(String(100))
    tier: Mapped[str] = mapped_column(String(2), nullable=False)  # A / B / C / D
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str | None] = mapped_column(String(20))  # mainstream / online / beauty / farm
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
