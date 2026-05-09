"""口碑提及（mention）爬蟲基底類

對應 P3-A 的 PenaltyCrawler，但寫入 mentions 表而非 admin_penalties。
子類只需實作 fetch()，由基底類處理：
  1. 媒體權威度查表
  2. 對 904 家診所做 fuzzy match
  3. Gemini 情緒分析 + 業配辨識
  4. 計算單篇貢獻值
  5. upsert mentions 表
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Iterable, TypedDict

from sqlalchemy.dialects.postgresql import insert as pg_insert

from database import AsyncSessionLocal
from models.mention import Mention
from services.clinic_matcher import match_clinic_with_score
from services.media_authority import lookup_authority
from services.news_score import calc_mention_contribution
from services.sentiment_analyzer import analyze_mention


class RawMention(TypedDict, total=False):
    source_type: str           # news / dcard / ptt / mobile01 / blog
    source_url: str            # UNIQUE 去重鍵
    source_name: str | None    # 媒體名 / 板名
    title: str
    content: str               # 完整內文（給 Gemini 分析用）
    author: str | None
    published_at: datetime | None
    target_clinic_name: str    # 從 query 或內容推斷的診所名（讓基底做 fuzzy match）
    interaction_likes: int
    interaction_comments: int
    interaction_dislikes: int
    interaction_weight: float  # 子類預先算好（社群用）
    raw_data: dict | None
    # Fast-path：子類已做完 Gemini 分析時直接帶這幾個欄位，base 跳過 analyze_mention
    pre_sentiment: str | None
    pre_sentiment_score: float | None
    pre_is_advertorial: bool | None
    pre_ad_confidence: float | None
    pre_summary: str | None
    pre_keywords: list[str] | None


class MentionCrawler(ABC):
    """所有口碑爬蟲的抽象基底"""

    source_type: str = ""              # news / dcard / ptt / mobile01 / blog
    needs_review: bool = False

    @abstractmethod
    async def fetch(self) -> Iterable[RawMention]:
        raise NotImplementedError

    async def run(self) -> dict:
        stats = {
            "fetched": 0,
            "matched": 0,
            "low_confidence": 0,
            "inserted": 0,
            "skipped": 0,
            "ad_filtered": 0,
        }

        records = list(await self._fetch_safe())
        stats["fetched"] = len(records)

        if not records:
            return stats

        async with AsyncSessionLocal() as session:
            for r in records:
                clinic_name = (r.get("target_clinic_name") or "").strip()
                if not clinic_name:
                    stats["skipped"] += 1
                    continue

                clinic_id, score = await match_clinic_with_score(session, clinic_name)
                if not clinic_id:
                    stats["skipped"] += 1
                    continue
                if score < 85:
                    stats["low_confidence"] += 1
                    record_status = "pending"
                else:
                    stats["matched"] += 1
                    record_status = "pending" if self.needs_review else "active"

                # 媒體權威度
                authority_weight, tier, media_name = await lookup_authority(session, r["source_url"])

                # Fast-path：子類預先分析過就直接用，否則打 Gemini
                if r.get("pre_sentiment") is not None:
                    analysis = {
                        "sentiment": r.get("pre_sentiment", "neutral"),
                        "sentiment_score": r.get("pre_sentiment_score") or 0.0,
                        "is_advertorial": bool(r.get("pre_is_advertorial", False)),
                        "ad_confidence": float(r.get("pre_ad_confidence") or 0.0),
                        "summary": r.get("pre_summary", ""),
                        "key_keywords": r.get("pre_keywords") or [],
                    }
                else:
                    analysis = analyze_mention(
                        title=r.get("title", ""),
                        content=r.get("content", ""),
                        source=r.get("source_name") or media_name,
                    )

                # 業配低信心（新聞類）→ 降權但仍存
                if analysis.get("is_advertorial") and analysis.get("ad_confidence", 0) >= 0.8:
                    stats["ad_filtered"] += 1
                    # 業配仍存，但 status=pending 等審核
                    if record_status == "active":
                        record_status = "pending"

                # 計算貢獻值
                pub = r.get("published_at")
                contribution = calc_mention_contribution({
                    "sentiment_score": analysis.get("sentiment_score", 0),
                    "authority_weight": authority_weight,
                    "is_advertorial": analysis.get("is_advertorial", False),
                    "ad_confidence": analysis.get("ad_confidence", 0),
                    "published_at": pub,
                    "interaction_weight": r.get("interaction_weight") or 1.0,
                })

                stmt = (
                    pg_insert(Mention)
                    .values(
                        target_type="clinic",
                        target_id=clinic_id,
                        source_type=r.get("source_type") or self.source_type,
                        source_name=r.get("source_name") or media_name,
                        source_url=r["source_url"],
                        title=r.get("title"),
                        content=r.get("content"),
                        author=r.get("author"),
                        published_at=pub,
                        sentiment=analysis.get("sentiment", "neutral"),
                        sentiment_score=analysis.get("sentiment_score", 0),
                        authority_weight=authority_weight,
                        interaction_likes=r.get("interaction_likes") or 0,
                        interaction_comments=r.get("interaction_comments") or 0,
                        interaction_dislikes=r.get("interaction_dislikes") or 0,
                        interaction_weight=r.get("interaction_weight") or 1.0,
                        is_advertorial=analysis.get("is_advertorial", False),
                        ad_confidence=analysis.get("ad_confidence", 0),
                        ai_summary=analysis.get("summary", ""),
                        keywords=analysis.get("key_keywords", []),
                        contribution_score=contribution,
                        status=record_status,
                    )
                    .on_conflict_do_nothing(index_elements=["source_url"])
                )
                result = await session.execute(stmt)
                if result.rowcount and result.rowcount > 0:
                    stats["inserted"] += 1

            await session.commit()

        return stats

    async def _fetch_safe(self) -> Iterable[RawMention]:
        try:
            return await self.fetch()
        except Exception as e:
            print(f"[{self.source_type}] fetch failed: {e}")
            import traceback
            traceback.print_exc()
            return []
