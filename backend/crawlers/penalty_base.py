"""稽查違規處分爬蟲基底類

每個來源（北市 PDF / 高雄 HTML / 台中食安處 / 新聞稿等）都繼承 PenaltyCrawler
並實作 fetch()，由基底類負責：
  1. 對 904 家診所做 fuzzy match
  2. 嚴重度分級
  3. 寫入 admin_penalties（依 source_url UNIQUE 去重）
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date
from typing import Iterable, TypedDict

from sqlalchemy.dialects.postgresql import insert as pg_insert

from database import AsyncSessionLocal
from models.admin_penalty import AdminPenalty
from services.clinic_matcher import match_clinic_with_score
from services.penalty_severity import classify_severity


class RawPenaltyRecord(TypedDict, total=False):
    """爬蟲 fetch() 輸出的單筆原始違規記錄"""
    source: str                # mohw / taipei / newtaipei / taoyuan / taichung / tainan / kaohsiung / ftc / news
    source_url: str            # UNIQUE 去重鍵
    penalty_date: date
    agency: str | None
    clinic_name: str
    violation_item: str
    violation_item_plain: str | None
    law_article: str | None
    fine_amount: int
    penalty_type: str | None   # 罰鍰 / 停業 / 警告 / 廢止 / 註銷
    raw_data: dict | None


class PenaltyCrawler(ABC):
    """所有違規處分爬蟲的抽象基底"""

    source_code: str = ""              # mohw / taipei / ...
    needs_review: bool = False         # True = 進待審核佇列（如新聞稿提取）

    @abstractmethod
    async def fetch(self) -> Iterable[RawPenaltyRecord]:
        """子類必須實作：從來源抓取原始記錄"""
        raise NotImplementedError

    async def run(self) -> dict:
        """完整執行：fetch → 比對診所 → 分級 → 寫 DB"""
        stats = {
            "fetched": 0,
            "matched": 0,
            "low_confidence": 0,
            "inserted": 0,
            "skipped": 0,
        }

        records = list(await self._fetch_safe())
        stats["fetched"] = len(records)

        if not records:
            return stats

        async with AsyncSessionLocal() as session:
            for r in records:
                clinic_name = (r.get("clinic_name") or "").strip()
                if not clinic_name:
                    stats["skipped"] += 1
                    continue

                clinic_id, score = await match_clinic_with_score(session, clinic_name)
                if not clinic_id:
                    stats["skipped"] += 1
                    continue
                if score < 85:
                    stats["low_confidence"] += 1
                    # 仍進 DB 但 status=pending 等人工確認
                    record_status = "pending"
                else:
                    stats["matched"] += 1
                    record_status = "pending" if self.needs_review else "active"

                severity, is_major = classify_severity(dict(r))

                stmt = (
                    pg_insert(AdminPenalty)
                    .values(
                        target_type="clinic",
                        target_id=clinic_id,
                        source=r.get("source") or self.source_code,
                        source_url=r["source_url"],
                        penalty_date=r["penalty_date"],
                        agency=r.get("agency"),
                        violation_item=r.get("violation_item"),
                        violation_item_plain=r.get("violation_item_plain"),
                        law_article=r.get("law_article"),
                        fine_amount=int(r.get("fine_amount") or 0),
                        penalty_type=r.get("penalty_type"),
                        severity=severity,
                        is_major=is_major,
                        status=record_status,
                        raw_data=r.get("raw_data"),
                    )
                    .on_conflict_do_nothing(index_elements=["source_url"])
                )
                result = await session.execute(stmt)
                if result.rowcount and result.rowcount > 0:
                    stats["inserted"] += 1

            await session.commit()

        return stats

    async def _fetch_safe(self) -> Iterable[RawPenaltyRecord]:
        """fetch() 包一層 try/except，避免單一爬蟲失敗影響整體 runner"""
        try:
            return await self.fetch()
        except Exception as e:
            print(f"[{self.source_code}] fetch failed: {e}")
            import traceback
            traceback.print_exc()
            return []
