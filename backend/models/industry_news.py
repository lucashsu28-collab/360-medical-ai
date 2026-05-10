from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class IndustryNews(Base):
    """醫美行業快訊（不對應特定診所，用於 /news 頁面）

    Category：
      domestic       — 國內醫美新聞
      korea          — 韓國醫美趨勢
      international  — 國際醫美新知
      tech           — 醫美新技術 / 設備
    """
    __tablename__ = "industry_news"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    source_name: Mapped[str | None] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(20), default='domestic')

    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    cover_image: Mapped[str | None] = mapped_column(Text)
    published_at: Mapped[datetime | None] = mapped_column(DateTime)

    ai_keywords: Mapped[list | None] = mapped_column(JSON, default=list)

    status: Mapped[str] = mapped_column(String(20), default='active')
    crawled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
