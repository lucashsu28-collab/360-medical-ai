from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base

class UnlockRecord(Base):
    __tablename__ = "unlock_records"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    user_id: Mapped[str] = mapped_column(String(200), index=True)
    target_name: Mapped[str] = mapped_column(String(200))
    unlock_type: Mapped[str] = mapped_column(String(50))
