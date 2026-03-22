from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base

class BroadcastRecord(Base):
    __tablename__ = "broadcast_records"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    user_id: Mapped[str] = mapped_column(String(200))
    message_type: Mapped[str] = mapped_column(String(50))
    target_name: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="success")
