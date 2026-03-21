import asyncio
import json
import re
import sys
import httpx
from bs4 import BeautifulSoup
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CLINICS_PATH = _DATA_DIR / "clinics_real.json"
JUDICIAL_PATH = _DATA_DIR / "judicial_results.json"

BASE = "https://judgment.judicial.gov.tw"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

def search_judicial_sync(clinic_name: str) -> dict:
    """
    正確流程：
    1. GET default.aspx → 取 hidden fields + cookies
    2. POST default.aspx 送出搜尋 → 取得 QID
    3. GET GetResultCount.ashx?ty=JUDBOOK&q=QID → 取得真實案件數
    """
    try:
        client = httpx.Client(verify=False, timeout=20, follow_redirects=True,
                              headers={"User-Agent": UA})

        # Step 1: 取得首頁 hidden fields
        home = client.get(f"{BASE}/FJUD/default.aspx")
        soup0 = BeautifulSoup(home.text, "html.parser")

        def val(sel):
            el = soup0.select_one(sel)
            return el["value"] if el else ""

        # Step 2: POST 搜尋
        payload = {
            "__VIEWSTATE": val("#__VIEWSTATE"),
            "__VIEWSTATEGENERATOR": val("#__VIEWSTATEGENERATOR"),
            "__VIEWSTATEENCRYPTED": "",
            "__EVENTVALIDATION": val("#__EVENTVALIDATION"),
            "txtKW": clinic_name,
            "judtype": "JUDBOOK",
            "whosub": "0",
            "ctl00$cp_content$btnSimpleQry": "送出查詢",
        }
        r2 = client.post(f"{BASE}/FJUD/default.aspx", data=payload,
                         headers={"Referer": f"{BASE}/FJUD/default.aspx"})

        soup2 = BeautifulSoup(r2.text, "html.parser")

        # 取 QID
        qid = ""
        qid_el = soup2.select_one("#hidQID")
        if qid_el:
            qid = qid_el["value"]
        if not qid:
            m = re.search(r"hidQID[^>]*value=\"([a-f0-9]+)\"", r2.text)
            if m:
                qid = m.group(1)
        if not qid:
            return {"found": False, "error": "無法取得 QID", "case_count": 0}

        # Step 3: 取得真實案件數
        r3 = client.get(
            f"{BASE}/controls/GetResultCount.ashx",
            params={"ty": "JUDBOOK", "co": "", "q": qid},
            headers={
                "X-Requested-With": "XMLHttpRequest",
                "Referer": f"{BASE}/FJUD/qryresult.aspx",
            },
        )
        data = r3.json()
        count = data.get("Total", 0)
        return {"found": True, "case_count": count}

    except Exception as e:
        return {"found": False, "error": str(e), "case_count": 0}


async def run():
    with open(CLINICS_PATH, encoding="utf-8") as f:
        clinics = json.load(f)
    total = len(clinics)

    results = {}
    if JUDICIAL_PATH.exists():
        with open(JUDICIAL_PATH, encoding="utf-8") as f:
            results = json.load(f)
        print(f"已載入 {len(results)} 筆既有結果\n")

    to_run = [c for c in clinics if c["id"] not in results]
    remaining = len(to_run)

    if remaining == 0:
        print("全部診所都已有司法資料，無需再跑。")
        return

    print(f"待處理 {remaining} 家（共 {total} 家）\n")

    loop = asyncio.get_event_loop()
    for i, clinic in enumerate(to_run):
        idx = total - remaining + i + 1
        print(f"[{idx}/{total}] {clinic['name']}...")

        info = await loop.run_in_executor(None, search_judicial_sync, clinic["name"])
        results[clinic["id"]] = info

        if info.get("found"):
            print(f"  [OK] 糾紛案件數: {info.get('case_count')}")
        else:
            print(f"  [!!] 錯誤: {info.get('error')}")

        if (i + 1) % 10 == 0:
            with open(JUDICIAL_PATH, "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)

    with open(JUDICIAL_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    found = sum(1 for v in results.values() if v.get("found"))
    has_cases = sum(1 for v in results.values() if v.get("case_count", 0) > 0)
    print(f"\n完成！成功抓取 {found}/{total} 家，其中 {has_cases} 家有相關裁判書")


if __name__ == "__main__":
    asyncio.run(run())
