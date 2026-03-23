from datetime import datetime
from sqlalchemy import String, Integer, BigInteger, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class ClinicReview(Base):
    __tablename__ = "clinic_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    clinic_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    author_name: Mapped[str | None] = mapped_column(String)
    rating: Mapped[int | None] = mapped_column(Integer)
    text: Mapped[str | None] = mapped_column(Text)
    time: Mapped[int | None] = mapped_column(BigInteger)
    relative_time: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
