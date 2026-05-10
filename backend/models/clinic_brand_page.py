from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base


class ClinicBrandPage(Base):
    """合作診所品牌頁（mockup /demo/clinic-redesign 對應的所有編輯欄位）

    與 clinics 1-1 關聯（clinic_id UNIQUE）
    """
    __tablename__ = "clinic_brand_pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    clinic_id: Mapped[str] = mapped_column(Text, ForeignKey("clinics.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Hero 主視覺
    hero_image_url: Mapped[str | None] = mapped_column(Text)
    slogan: Mapped[str | None] = mapped_column(Text)
    subtitle: Mapped[str | None] = mapped_column(Text)

    # 5 大特色亮點 [{title, desc}]
    features: Mapped[list | None] = mapped_column(JSON, default=list)

    # 熱門精選療程 [{title, tagline, desc, price, badge, image}]
    signature_treatments: Mapped[list | None] = mapped_column(JSON, default=list)

    # 院長 {name, title, years, desc, photo}
    director: Mapped[dict | None] = mapped_column(JSON)

    # Before/After [{treatment, duration, note, face_image}]
    before_after: Mapped[list | None] = mapped_column(JSON, default=list)

    # 院長推薦療程 [{title, target, items, doctor_note, price_from, image}]
    doctor_picks: Mapped[list | None] = mapped_column(JSON, default=list)

    # 完整療程列表 [{name, price, desc, image}]
    treatments_full: Mapped[list | None] = mapped_column(JSON, default=list)

    # 客戶好評 [{name, initial, text, rating, treatment}]
    testimonials: Mapped[list | None] = mapped_column(JSON, default=list)

    # 媒體報導 [{outlet, title, date, tier, url}]
    media_reports: Mapped[list | None] = mapped_column(JSON, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
