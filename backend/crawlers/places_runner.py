import asyncio
import json
import os
from pathlib import Path

from .google_places import get_clinic_places_info

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CLINICS_PATH = _DATA_DIR / "clinics_real.json"
PLACES_PATH = _DATA_DIR / "places_results.json"


async def run():
    # 讀取全部診所，不限制 [:50]
    with open(CLINICS_PATH, encoding="utf-8") as f:
        clinics = json.load(f)

    total = len(clinics)

    # 斷點續跑：若已有 places_results.json，讀入並跳過 found=True 的
    results = {}
    if PLACES_PATH.exists():
        with open(PLACES_PATH, encoding="utf-8") as f:
            results = json.load(f)
        print(f"已載入 {len(results)} 筆既有結果，跳過已找到的診所\n")

    # 只跑還沒有資料的（沒有 id 或 found 不為 True）
    to_run = [c for c in clinics if not results.get(c["id"], {}).get("found")]
    remaining = len(to_run)

    if remaining == 0:
        print("全部診所都已有 Google 評分，無需再跑。")
        found = sum(1 for v in results.values() if v.get("found"))
        print(f"總計找到 {found}/{total} 家")
        return

    print(f"待處理 {remaining} 家（共 {total} 家）\n")

    for i, clinic in enumerate(to_run):
        idx = total - remaining + i + 1  # 顯示進度如 51/904
        print(f"[{idx}/{total}] {clinic['name']}...")
        try:
            info = await get_clinic_places_info(
                clinic["name"],
                clinic["address"],
            )
            results[clinic["id"]] = info
            if info.get("found"):
                print(f"  [OK] 評分:{info.get('rating')} 評論:{info.get('review_count')}")
            else:
                print(f"  [--] 找不到")
        except Exception as e:
            results[clinic["id"]] = {"found": False, "error": str(e)}
            print(f"  [!!] 錯誤: {e}")

        await asyncio.sleep(0.5)  # 避免超過 API 限制

    with open(PLACES_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    found = sum(1 for v in results.values() if v.get("found"))
    print(f"\n完成！找到 {found}/{total} 家的 Google 評分")


if __name__ == "__main__":
    asyncio.run(run())
