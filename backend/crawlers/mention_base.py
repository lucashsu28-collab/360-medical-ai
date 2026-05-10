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
                # 提取出的診所名通常是「璞真醫美診所」這種完整名稱，可能跟 DB「璞真整形外科診所」差幾個字
                # threshold 設定（rapidfuzz WRatio 0-100）：
                #   < 70：跳過（風險太高，例：「光澤」vs「拾光」）
                #   70-85：低信心，status=pending 等人工審核
                #   ≥ 85：高信心，status=active
                # 額外防呆：高信心時，前 2 字必須匹配（防「光澤醫美」誤配「拾光醫美」這種同尾不同首）
                if not clinic_id or score < 70:
                    stats["skipped"] += 1
                    continue

                # 取得配對到的診所名做前 2 字檢查
                from models.clinic import Clinic
                _matched = await session.get(Clinic, clinic_id)
                _matched_name = (_matched.name if _matched else "") or ""
                _ext_short = clinic_name.replace("醫美診所", "").replace("醫美", "").replace("整形外科", "").replace("診所", "").strip()
                _mat_short = _matched_name.replace("醫美診所", "").replace("醫美", "").replace("整形外科", "").replace("診所", "").strip()
                _prefix_ok = bool(_ext_short and _mat_short and _ext_short[:2] == _mat_short[:2])

                if score < 85 or not _prefix_ok:
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

                # 正規化 sentiment 字串到 VARCHAR(10) 內（positive/neutral/negative）
                # Gemini 可能回 "positive_strong"/"negative_strong"（15 字）→ 折回基礎類別
                _raw_sent = (analysis.get("sentiment") or "neutral").strip().lower()
                if _raw_sent in ("positive_strong", "positive"):
                    analysis["sentiment"] = "positive"
                elif _raw_sent in ("negative_strong", "negative"):
                    analysis["sentiment"] = "negative"
                else:
                    analysis["sentiment"] = "neutral"

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
                # 用 SAVEPOINT 包單筆 insert：失敗只回滾這筆，不影響整批
                try:
                    async with session.begin_nested():
                        result = await session.execute(stmt)
                        if result.rowcount and result.rowcount > 0:
                            stats["inserted"] += 1
                except Exception as e:
                    stats.setdefault("insert_errors", 0)
                    stats["insert_errors"] += 1
                    print(f"[{self.source_type}] insert failed for {r.get('source_url')}: {e}")

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
