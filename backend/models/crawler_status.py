from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base

class CrawlerStatus(Base):
    __tablename__ = "crawler_status"

    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    last_run: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), default="unknown")
    error: Mapped[str | None] = mapped_column(Text)
    error_message: Mapped[str | None] = mapped_column(Text)
    records_updated: Mapped[int | None] = mapped_column(Integer)
