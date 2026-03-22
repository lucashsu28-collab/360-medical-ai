import httpx, re, sys
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

# Step1: 取得 QID
r1 = client.get(
    "https://judgment.judicial.gov.tw/FJUD/qryresult.aspx",
    params={"kw": "美麗晶華", "judtype": "JUDBOOK", "action": "q"},
    headers={"User-Agent": headers["User-Agent"]},
)
qid_m = re.search(r'hidQID[^>]*value="([^"]+)"', r1.text)
qid = qid_m.group(1) if qid_m else ""
print(f"QID: {qid}")
print(f"Cookies: {dict(client.cookies)}\n")

# Step2: 試各種可能的 API endpoint
base = "https://judgment.judicial.gov.tw/FJUD"
candidates = [
    f"{base}/qryresultlst.aspx?QID={qid}&page=1",
    f"{base}/FJUD0020.aspx?QID={qid}",
    f"{base}/GetResult.aspx?QID={qid}",
    f"{base}/qryresult.aspx?QID={qid}&page=1",
    f"{base}/qry.aspx?QID={qid}",
]

for url in candidates:
    r = client.get(url, headers=headers)
    print(f"[{r.status_code}] {url}")
    soup = BeautifulSoup(r.text, "html.parser")
    badge = soup.select_one("span.badge")
    rows = soup.select("table tr")
    print(f"  badge={badge.text if badge else 'N/A'}  rows={len(rows)}")
    if len(rows) > 1 or (badge and badge.text != "19097123"):
        print("  >>> 可能找到了！")
        print(r.text[:500])
    print()
