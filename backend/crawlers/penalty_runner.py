"""稽查違規處分爬蟲統一入口

呼叫所有來源爬蟲，給 Cloud Scheduler / 手動執行用。
"""
from __future__ import annotations

import asyncio

from crawlers.penalty_news import GoogleNewsPenaltyCrawler


async def run_all() -> dict:
    """跑所有處分爬蟲，並重算 reputation_scores 快照"""
    from services.reputation_recalc import recalc_penalty_scores

    results: dict[str, dict] = {}

    crawlers = [
        ("news", GoogleNewsPenaltyCrawler()),
        # ("kaohsiung", KaohsiungPenaltyCrawler()),  # 來源匿名，已取消
        # ("taichung", TaichungPenaltyCrawler()),    # 來源匿名，已取消
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

    # 爬完後重算所有診所的 penalty_score 快照
    print(f"\n=== Recalculating reputation_scores ===")
    try:
        recalc_stats = await recalc_penalty_scores()
        results["reputation_recalc"] = recalc_stats
        print(f"[reputation_recalc] {recalc_stats}")
    except Exception as e:
        results["reputation_recalc"] = {"error": str(e)}
        print(f"[reputation_recalc] FAILED: {e}")

    return results


def main() -> None:
    stats = asyncio.run(run_all())
    print("\n=== ALL DONE ===")
    for k, v in stats.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
