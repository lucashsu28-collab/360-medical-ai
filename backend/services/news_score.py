"""News Score / Social Score 計算公式

依 docs/REPUTATION_SCORING.md：
  Score = 60 + Σ(每篇貢獻值)
  News 每篇貢獻 = 情緒分 × 媒體權威 × 業配折扣 × 時間衰減 × 5
  Social 每篇貢獻 = 情緒分 × 平台權重 × 互動權重 × 業配折扣 × 時間衰減 × 5

  時間衰減（共用）：
    近 3 個月 ×1.0 / 3-6 月 ×0.7 / 6-12 月 ×0.4 / 12+ 月 不計入

  防作弊：單篇貢獻上限 ±5 分
"""
from __future__ import annotations

from datetime import date, datetime, timedelta


def _time_decay(published_at: datetime | None) -> float:
    """時間衰減權重"""
    if not published_at:
        return 0.0
    today = datetime.utcnow()
    months = (today - published_at).days / 30.0
    if months <= 3:
        return 1.0
    if months <= 6:
        return 0.7
    if months <= 12:
        return 0.4
    return 0.0


def _ad_discount(is_advertorial: bool, ad_confidence: float = 0.0) -> float:
    """業配折扣"""
    if not is_advertorial:
        return 1.0
    if ad_confidence >= 0.8:
        return 0.1   # 確認業配
    return 0.3       # 疑似業配


def calc_mention_contribution(mention: dict) -> float:
    """
    單篇 mention 對 Score 的貢獻值
    輸入欄位：sentiment_score, authority_weight, is_advertorial, ad_confidence, published_at, interaction_weight (optional)
    """
    s = float(mention.get("sentiment_score") or 0)
    auth = float(mention.get("authority_weight") or 1.0)
    ad = _ad_discount(
        bool(mention.get("is_advertorial", False)),
        float(mention.get("ad_confidence") or 0),
    )
    pub = mention.get("published_at")
    if isinstance(pub, str):
        try:
            pub = datetime.fromisoformat(pub.replace("Z", "+00:00"))
        except (TypeError, ValueError):
            pub = None
    decay = _time_decay(pub)
    interaction = float(mention.get("interaction_weight") or 1.0)

    contribution = s * auth * ad * decay * interaction * 5

    # 重大事件加重（不衰減）
    if mention.get("major_event") == "medical_incident":
        contribution -= 20
    elif mention.get("major_event") == "lawsuit_lost":
        contribution -= 10
    elif mention.get("major_event") == "award":
        contribution += 5
    else:
        # 一般情況下單篇上限 ±5
        contribution = max(-5, min(5, contribution))

    return round(contribution, 2)


def calc_news_score(mentions: list[dict]) -> int:
    """News Score：基底 60 + Σ 貢獻值，cap 0~100"""
    base = 60
    if not mentions:
        return base
    total = base + sum(calc_mention_contribution(m) for m in mentions)
    return max(0, min(100, int(round(total))))


def calc_social_score(mentions: list[dict]) -> int:
    """Social Score：用同一公式，但 mentions 是社群來源（含互動權重）"""
    return calc_news_score(mentions)


def calc_grade(score: int) -> tuple[str, str]:
    """評分等級對照"""
    if score >= 90:
        return "S", "🌟 口碑卓越"
    if score >= 80:
        return "A", "⭐ 口碑優良"
    if score >= 70:
        return "B", "✓ 口碑良好"
    if score >= 60:
        return "C", "➖ 口碑中性"
    if score >= 50:
        return "D", "⚠️ 口碑普通"
    return "E", "🔴 口碑警示"
