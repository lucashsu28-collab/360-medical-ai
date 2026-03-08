"""批次爬取 13 家診所的健保特約合法登記資料，存至 backend/data/nhi_results.json"""
import asyncio
import json
from pathlib import Path

from crawlers.nhi import download_all_clinics
from crawlers.calc_legal_score import name_match

# 13 家診所名稱（與 recommend 假資料對應）
CLINIC_NAMES = [
    "晶緻醫美診所",
    "璞真整形外科診所",
    "悅顏皮膚科診所",
    "凰漾美學診所",
    "光澤皮膚科診所",
    "薇采醫美診所",
    "雙星皮膚科診所",
    "禾澄醫美診所",
    "典雅整形外科診所",
    "絲漾醫美診所",
    "悠美整形診所",
    "凌頂醫美診所",
    "晨曦皮膚科診所",
]

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
NHI_ALL_PATH = _DATA_DIR / "nhi_all.json"
OUTPUT_PATH = _DATA_DIR / "nhi_results.json"


async def run_batch() -> None:
    # 1. 下載全量診所資料
    print("下載健保特約診所全量資料…")
    all_records = await download_all_clinics(limit=1000)
    print(f"  共 {len(all_records)} 筆")

    # 2. 存到 backend/data/nhi_all.json
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(NHI_ALL_PATH, "w", encoding="utf-8") as f:
        json.dump(all_records, f, ensure_ascii=False, indent=2)
    print(f"已寫入 {NHI_ALL_PATH}")

    # 3. 對 13 家診所做本地名稱比對
    results = {}
    for name in CLINIC_NAMES:
        matched = [r for r in all_records if name_match(name, r.get("HOSP_NAME", ""))]
        results[name] = {
            "found": len(matched) > 0,
            "records": matched,
            "raw_count": len(all_records),
        }
        print(f"  {name} -> found: {results[name]['found']}, 匹配 {len(matched)} 筆")

    # 4. 結果存到 backend/data/nhi_results.json
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"已寫入 {OUTPUT_PATH}")


def main() -> None:
    print("批次查詢健保特約醫事機構（13 家診所）…")
    asyncio.run(run_batch())


if __name__ == "__main__":
    main()
