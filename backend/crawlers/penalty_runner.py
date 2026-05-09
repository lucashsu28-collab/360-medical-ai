"""稽查違規處分爬蟲統一入口

呼叫所有來源爬蟲，給 Cloud Scheduler / 手動執行用。
"""
from __future__ import annotations

import asyncio

from crawlers.penalty_news import GoogleNewsPenaltyCrawler


async def run_all() -> dict:
    """跑所有處分爬蟲，回傳每個來源的統計"""
    results: dict[str, dict] = {}

    crawlers = [
        ("news", GoogleNewsPenaltyCrawler()),
        # ("kaohsiung", KaohsiungPenaltyCrawler()),  # Step 2-C
        # ("taichung", TaichungPenaltyCrawler()),    # Step 2-D
    ]

    for code, crawler in crawlers:
        print(f"\n=== Running {code} crawler ===")
        try:
            stats = await crawler.run()
            results[code] = stats
            print(f"[{code}] {stats}")
        except Exception as e:
            results[code] = {"error": str(e)}
            print(f"[{code}] FAILED: {e}")

    return results


def main() -> None:
    stats = asyncio.run(run_all())
    print("\n=== ALL DONE ===")
    for k, v in stats.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
