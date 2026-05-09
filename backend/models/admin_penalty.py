from datetime import datetime, date
from sqlalchemy import String, Integer, DateTime, Date, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class AdminPenalty(Base):
    """行政處分（稽查違規紀錄）— 第 4 維度資料源"""
    __tablename__ = "admin_penalties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    target_type: Mapped[str] = mapped_column(String(10), nullable=False)  # clinic / doctor
    target_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)

    source: Mapped[str] = mapped_column(String(30), nullable=False)  # mohw / taipei / newtaipei / taoyuan / taichung / tainan / kaohsiung / ftc
    source_url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)

    penalty_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    agency: Mapped[str | None] = mapped_column(String(100))
    violation_item: Mapped[str | None] = mapped_column(Text)
    violation_item_plain: Mapped[str | None] = mapped_column(Text)  # Gemini 白話翻譯
    law_article: Mapped[str | None] = mapped_column(String(200))
    fine_amount: Mapped[int] = mapped_column(Integer, default=0)
    penalty_type: Mapped[str | None] = mapped_column(String(20))  # 罰鍰 / 停業 / 警告 / 廢止

    severity: Mapped[str] = mapped_column(String(10), default='minor', index=True)  # severe / medium / minor
    is_major: Mapped[bool] = mapped_column(Boolean, default=False)  # 重大違規（永久顯示）

    status: Mapped[str] = mapped_column(String(20), default='active')  # active / hidden / pending
    raw_data: Mapped[dict | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
