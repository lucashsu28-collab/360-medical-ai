import httpx, re, sys, json
sys.stdout.reconfigure(encoding="utf-8")
import warnings
warnings.filterwarnings("ignore")
from bs4 import BeautifulSoup

headers_browser = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://judgment.judicial.gov.tw/FJUD/default.aspx",
}
headers_ajax = {
    **headers_browser,
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://judgment.judicial.gov.tw/FJUD/qryresult.aspx",
}

def search_judicial(clinic_name: str) -> int:
    client = httpx.Client(verify=False, timeout=15, follow_redirects=True)

    # Step 1: 取得搜尋結果頁（拿 QID 和 data-type）
    r1 = client.get(
        "https://judgment.judicial.gov.tw/FJUD/qryresult.aspx",
        params={"kw": clinic_name, "judtype": "JUDBOOK", "action": "q"},
        headers=headers_browser,
    )
    soup = BeautifulSoup(r1.text, "html.parser")

    qid_input = soup.select_one("#hidQID")
    if not qid_input:
        print(f"  找不到 hidQID")
        return -1
    qid = qid_input["value"]
    print(f"  QID={qid[:12]}...")

    # 找 .one-bar li a 的 data-type
    types = []
    for a in soup.select(".one-bar li a[data-type]"):
        types.append(a.get("data-type", ""))
    print(f"  data-types: {types}")

    # 如果沒找到就用預設
    if not types:
        types = ["JUDBOOK"]

    # Step 2: 呼叫 GetResultCount.ashx
    total = 0
    for ty in types:
        r2 = client.get(
            "https://judgment.judicial.gov.tw/controls/GetResultCount.ashx",
            params={"ty": ty, "co": "", "q": qid},
            headers=headers_ajax,
        )
        print(f"  ty={ty} status={r2.status_code} resp={r2.text[:150]}")
        try:
            data = json.loads(r2.text)
            if isinstance(data, dict):
                t = data.get("Total", data.get("total", 0))
                if t:
                    total += t
        except Exception:
            pass

    return total

# 測試
for name in ["美麗晶華", "台灣美容外科診所", "某某不存在診所ZZZ999"]:
    print(f"\n【{name}】")
    count = search_judicial(name)
    print(f"  >>> 案件數: {count}")
