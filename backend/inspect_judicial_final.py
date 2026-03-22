import httpx, re, sys, json
sys.stdout.reconfigure(encoding="utf-8")
import warnings
warnings.filterwarnings("ignore")
from bs4 import BeautifulSoup

BASE = "https://judgment.judicial.gov.tw"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

def search_judicial(clinic_name: str) -> int:
    client = httpx.Client(verify=False, timeout=15, follow_redirects=True,
                          headers={"User-Agent": UA})

    # Step 1: GET default.aspx → 拿 hidden fields + cookies
    home = client.get(f"{BASE}/FJUD/default.aspx")
    soup0 = BeautifulSoup(home.text, "html.parser")

    def val(sel):
        el = soup0.select_one(sel)
        return el["value"] if el else ""

    # Step 2: POST 正確欄位
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

    print(f"  POST → status={r2.status_code} url={str(r2.url)[:80]}")
    soup2 = BeautifulSoup(r2.text, "html.parser")

    # 找 QID（可能在 hidQID 或 URL 的 q= 參數）
    qid = ""
    qid_el = soup2.select_one("#hidQID")
    if qid_el:
        qid = qid_el["value"]
    else:
        m = re.search(r"[?&]q=([a-f0-9]{30,})", str(r2.url))
        if m:
            qid = m.group(1)

    if not qid:
        # 試從頁面 JS 中找
        m2 = re.search(r"hidQID[^>]*value=\"([a-f0-9]+)\"", r2.text)
        if m2:
            qid = m2.group(1)

    if not qid:
        print(f"  找不到 QID，頁面標題: {soup2.title.text if soup2.title else '無'}")
        return -1

    print(f"  QID={qid[:16]}...")

    # Step 3: 呼叫 GetResultCount.ashx
    r3 = client.get(
        f"{BASE}/controls/GetResultCount.ashx",
        params={"ty": "JUDBOOK", "co": "", "q": qid},
        headers={
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"{BASE}/FJUD/qryresult.aspx",
        },
    )
    print(f"  API status={r3.status_code} resp={r3.text[:200]}")
    try:
        data = r3.json()
        return data.get("Total", 0)
    except Exception:
        return -1

for name in ["美麗晶華", "某某不存在診所ZZZ999"]:
    print(f"\n【{name}】")
    count = search_judicial(name)
    print(f"  >>> 案件數: {count}")
