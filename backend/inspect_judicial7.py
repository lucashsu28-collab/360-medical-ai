import httpx, re, sys, json
sys.stdout.reconfigure(encoding="utf-8")
import warnings
warnings.filterwarnings("ignore")
from bs4 import BeautifulSoup

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://judgment.judicial.gov.tw/FJUD/qryresult.aspx",
    "X-Requested-With": "XMLHttpRequest",
}
client = httpx.Client(verify=False, timeout=15, follow_redirects=True)

def search_judicial(clinic_name: str) -> dict:
    # Step 1: 取得 QID
    r1 = client.get(
        "https://judgment.judicial.gov.tw/FJUD/qryresult.aspx",
        params={"kw": clinic_name, "judtype": "JUDBOOK", "action": "q"},
        headers={"User-Agent": headers["User-Agent"]},
    )
    qid_m = re.search(r'hidQID[^>]*value="([^"]+)"', r1.text)
    if not qid_m:
        return {"error": "無法取得 QID", "count": -1}
    qid = qid_m.group(1)

    # Step 2: 呼叫真正的 API
    r2 = client.get(
        "https://judgment.judicial.gov.tw/controls/GetResultCount.ashx",
        params={"q": qid},
        headers=headers,
    )
    print(f"  QID={qid[:8]}... API status={r2.status_code}")
    print(f"  API response: {r2.text[:200]}")

    try:
        data = r2.json()
        return {"count": data.get("Total", data.get("total", -1)), "raw": data}
    except Exception:
        return {"error": r2.text[:100], "count": -1}

# 測試幾個診所
for name in ["美麗晶華", "台灣美容外科診所", "某某不存在診所XYZ999"]:
    print(f"\n【{name}】")
    result = search_judicial(name)
    print(f"  結果: {result}")
