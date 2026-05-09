"""嚴重度自動分級

依 docs/PENALTY_DISPLAY_POLICY.md 規則：
  🔴 重大（severe + is_major=True）：停業 / 廢止 / 致死致傷 / 密醫 / 人體試驗
  🟡 中度（medium）：罰款 ≥ NT$ 100,000，或單一年度受罰 ≥ 3 次
  🟢 輕微（minor）：罰款 < NT$ 50,000，或單純廣告 / 標示類違規

「單一年度受罰 ≥ 3 次」屬於跨筆統計邏輯，不在 classify_severity 內處理，
由排程後處理（recalc_severity_by_count）批次調整。
"""
from __future__ import annotations

import re

# 重大違規法條 / 事實樣板
_MAJOR_LAW_PATTERNS = [
    r"醫療法.{0,5}第\s*28\s*條",   # 密醫
    r"人體試驗管理辦法",
    r"廢止.{0,5}執照",
    r"廢止.{0,5}證書",
    r"註銷.{0,5}執照",
]
_MAJOR_FACT_PATTERNS = [
    r"死亡",
    r"重傷",
    r"密醫",
    r"非醫師執行",
    r"非法執業",
]
_MAJOR_PENALTY_TYPES = ["停業", "廢止", "註銷"]


def classify_severity(rec: dict) -> tuple[str, bool]:
    """
    回傳 (severity, is_major)
      severity: 'severe' | 'medium' | 'minor'
      is_major: True 表示永久顯示（不受時間衰減保護）
    """
    item = " ".join([
        str(rec.get("violation_item") or ""),
        str(rec.get("violation_item_plain") or ""),
        str(rec.get("law_article") or ""),
    ])
    fine = int(rec.get("fine_amount") or 0)
    ptype = str(rec.get("penalty_type") or "")

    # 1. 重大違規
    for pat in _MAJOR_LAW_PATTERNS + _MAJOR_FACT_PATTERNS:
        if re.search(pat, item):
            return "severe", True

    for pt in _MAJOR_PENALTY_TYPES:
        if pt in ptype:
            return "severe", True

    # 2. 中度
    if fine >= 100_000:
        return "medium", False

    # 3. 輕微
    return "minor", False


def calc_penalty_score(penalties: list[dict]) -> int:
    """
    依 PENALTY_DISPLAY_POLICY.md 第八段公式計算 0-100 分

    扣分規則：
      🔴 重大：每筆 -25 分（不衰減）
      🟡 中度：每筆 -10 分（衰減）
      🟢 輕微：每筆 -3 分（衰減）

    時間衰減：
      近 1 年    ×1.0
      1-2 年    ×0.7
      2-3 年    ×0.4
      3-5 年    ×0.2
      5+ 年     ×0（重大例外）
    """
    from datetime import date

    today = date.today()
    score = 100

    for p in penalties:
        pdate = p.get("penalty_date")
        if not pdate:
            continue
        if isinstance(pdate, str):
            from datetime import datetime
            pdate = datetime.fromisoformat(pdate).date()

        years = (today - pdate).days / 365.0
        severity = p.get("severity", "minor")
        is_major = p.get("is_major", False)

        if severity == "severe":
            # 重大不衰減
            score -= 25
        else:
            # 時間衰減
            if years <= 1:
                decay = 1.0
            elif years <= 2:
                decay = 0.7
            elif years <= 3:
                decay = 0.4
            elif years <= 5:
                decay = 0.2
            else:
                decay = 0  # 5 年以上不計入（除非 is_major）
                if is_major:
                    decay = 1.0

            base = -10 if severity == "medium" else -3
            score += int(base * decay)

    return max(0, min(100, score))
