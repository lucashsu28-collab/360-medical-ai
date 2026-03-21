"""
把 judicial_results.json 的案件數整合進 clinics_real.json 的 score_breakdown。
司法分數計算：
  - 0 件 → 10.0 分
  - 1 件 → 7.0 分
  - 2 件 → 5.0 分
  - 3 件以上 → 3.0 分
同時重新計算 score（綜合評分）。
"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CLINICS_PATH = _DATA_DIR / "clinics_real.json"
JUDICIAL_PATH = _DATA_DIR / "judicial_results.json"


def calc_judicial_score(case_count: int) -> float:
    if case_count == 0:
        return 10.0
    if case_count == 1:
        return 7.0
    if case_count == 2:
        return 5.0
    return 3.0


def calc_total_score(breakdown: dict) -> float:
    """
    綜合評分公式：
    google 40% + judicial 30% + legal 20% + review_bonus 10%
    media / social 尚無真實資料，暫不計入
    """
    google = breakdown.get("google", 0)
    judicial = breakdown.get("judicial", 10.0)
    legal = breakdown.get("legal", 10.0)
    review_bonus = breakdown.get("review_bonus", 0)
    return round(google * 0.4 + judicial * 0.3 + legal * 0.2 + review_bonus * 0.1, 2)


def run():
    with open(CLINICS_PATH, encoding="utf-8") as f:
        clinics = json.load(f)
    with open(JUDICIAL_PATH, encoding="utf-8") as f:
        judicial = json.load(f)

    updated = 0
    for clinic in clinics:
        cid = clinic["id"]
        j = judicial.get(cid, {})
        case_count = j.get("case_count", 0)
        j_score = calc_judicial_score(case_count)

        clinic.setdefault("score_breakdown", {})
        clinic["score_breakdown"]["judicial"] = j_score
        clinic["dispute_count"] = case_count
        clinic["score"] = calc_total_score(clinic["score_breakdown"])
        updated += 1

    with open(CLINICS_PATH, "w", encoding="utf-8") as f:
        json.dump(clinics, f, ensure_ascii=False, indent=2)

    # 統計
    has_disputes = sum(1 for c in clinics if c.get("dispute_count", 0) > 0)
    print(f"完成！更新 {updated} 家診所")
    print(f"有裁判書紀錄：{has_disputes} 家")
    print(f"無裁判書紀錄：{updated - has_disputes} 家")
    print()
    print("前3筆範例：")
    for c in clinics[:3]:
        print(f"  {c['name']} | 案件數:{c['dispute_count']} | 司法分:{c['score_breakdown']['judicial']} | 綜合分:{c['score']}")


if __name__ == "__main__":
    run()
