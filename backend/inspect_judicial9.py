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

    # Step 1: GET default.aspx → 取得 __VIEWSTATE 和 cookies
    home = client.get(f"{BASE}/FJUD/default.aspx")
    soup0 = BeautifulSoup(home.text, "html.parser")
    vs = soup0.select_one("#__VIEWSTATE")
    evv = soup0.select_one("#__EVENTVALIDATION")
    vsg = soup0.select_one("#__VIEWSTATEGENERATOR")

    # Step 2: POST 搜尋到 default.aspx
    payload = {
        "__VIEWSTATE": vs["value"] if vs else "",
        "__EVENTVALIDATION": evv["value"] if evv else "",
        "__VIEWSTATEGENERATOR": vsg["value"] if vsg else "",
        "txtKW": clinic_name,
        "judtype": "JUDBOOK",
        "action": "q",
        "btnQuery": "查詢",
    }
    r2 = client.post(f"{BASE}/FJUD/default.aspx", data=payload,
                     headers={"Referer": f"{BASE}/FJUD/default.aspx"})

    print(f"  POST status={r2.status_code} url={str(r2.url)[:80]}")
    soup2 = BeautifulSoup(r2.text, "html.parser")

    # 看最終頁面是否有 QID
    qid_input = soup2.select_one("#hidQID")
    if qid_input:
        qid = qid_input["value"]
        print(f"  QID={qid[:16]}...")

        r3 = client.get(
            f"{BASE}/controls/GetResultCount.ashx",
            params={"ty": "JUDBOOK", "co": "", "q": qid},
            headers={"X-Requested-With": "XMLHttpRequest",
                     "Referer": f"{BASE}/FJUD/qryresult.aspx"},
        )
        print(f"  API resp={r3.text[:200]}")
        try:
            data = r3.json()
            return data.get("Total", 0)
        except Exception:
            return -1
    else:
        # 搜尋結果可能在 URL 參數裡的 q= 
        q_in_url = re.search(r"[?&]q=([a-f0-9]+)", str(r2.url))
        if q_in_url:
            qid = q_in_url.group(1)
            print(f"  QID from URL={qid[:16]}...")
            r3 = client.get(
                f"{BASE}/controls/GetResultCount.ashx",
                params={"ty": "JUDBOOK", "co": "", "q": qid},
                headers={"X-Requested-With": "XMLHttpRequest"},
            )
            print(f"  API resp={r3.text[:200]}")
            try:
                return r3.json().get("Total", 0)
            except Exception:
                return -1

        print(f"  找不到 QID，final URL: {str(r2.url)}")
        print(f"  頁面摘要: {soup2.text[:300]}")
        return -1

for name in ["美麗晶華", "某某不存在診所ZZZ999"]:
    print(f"\n【{name}】")
    count = search_judicial(name)
    print(f"  >>> 案件數: {count}")
