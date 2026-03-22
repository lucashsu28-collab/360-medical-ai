import httpx, re, sys, json
sys.stdout.reconfigure(encoding="utf-8")
import warnings
warnings.filterwarnings("ignore")
from bs4 import BeautifulSoup

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://judgment.judicial.gov.tw/FJUD/default.aspx",
}

# Step 1: 先拿主頁取得 session cookie
s = httpx.Client(verify=False, timeout=15, headers=headers, follow_redirects=True)
home = s.get("https://judgment.judicial.gov.tw/FJUD/default.aspx")
print("主頁 status:", home.status_code)
print("Cookies:", dict(s.cookies))

# Step 2: 試 POST 送出搜尋（ASP.NET WebForms 需 POST）
soup0 = BeautifulSoup(home.text, "html.parser")
vs = soup0.select_one("#__VIEWSTATE")
evv = soup0.select_one("#__EVENTVALIDATION")

payload = {
    "__VIEWSTATE": vs["value"] if vs else "",
    "__EVENTVALIDATION": evv["value"] if evv else "",
    "txtKW": "美麗晶華",
    "judtype": "JUDBOOK",
    "btnQuery": "查詢",
}
r2 = s.post("https://judgment.judicial.gov.tw/FJUD/default.aspx", data=payload)
print("\nPOST 搜尋 status:", r2.status_code)
print("Location:", r2.headers.get("location", "無"))
print("URL:", str(r2.url))

# Step 3: 看結果頁面
soup2 = BeautifulSoup(r2.text, "html.parser")
badge = soup2.select_one("span.badge")
print("\nbadge:", badge.text if badge else "無")

# 找含數字的元素
idx = r2.text.find("查詢結果")
if idx >= 0:
    print("\n查詢結果 附近 HTML:")
    print(r2.text[idx:idx+300])

# Step 4: 試找 AJAX API — 看 JS 裡有沒有 fetch/ajax URL
ajax_urls = re.findall(r"(?:url|href)['\"]?\s*[:=]\s*['\"]([^'\"]+(?:json|api|query|search)[^'\"]*)['\"]", home.text, re.I)
print("\n=== JS 中疑似 API URLs ===")
for u in ajax_urls[:10]:
    print(u)
