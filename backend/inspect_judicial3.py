import httpx, re, sys
sys.stdout.reconfigure(encoding="utf-8")
import warnings
warnings.filterwarnings("ignore")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://judgment.judicial.gov.tw/FJUD/default.aspx",
}

r = httpx.get(
    "https://judgment.judicial.gov.tw/FJUD/qryresult.aspx",
    params={"kw": "美麗晶華", "judtype": "JUDBOOK", "action": "q"},
    headers=headers,
    verify=False,
    timeout=15,
)

# 找 JS 中所有的 URL / API
print("=== JS 中的 URL 片段 ===")
urls = re.findall(r"['\"](/FJUD/[^'\"]{3,80})['\"]", r.text)
for u in sorted(set(urls)):
    print(u)

print("\n=== hidQID 值 ===")
m = re.search(r'hidQID[^>]*value="([^"]+)"', r.text)
print(m.group(1) if m else "無")

print("\n=== JS 中有 QID 相關的程式碼 ===")
lines = r.text.splitlines()
for line in lines:
    if "QID" in line or "qid" in line or "GetResult" in line or "PageResult" in line or "ajax" in line.lower():
        print(line.strip()[:200])
