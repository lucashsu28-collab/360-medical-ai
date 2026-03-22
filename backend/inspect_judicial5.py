import httpx, re, sys
sys.stdout.reconfigure(encoding="utf-8")
import warnings
warnings.filterwarnings("ignore")
from bs4 import BeautifulSoup

r = httpx.get(
    "https://judgment.judicial.gov.tw/FJUD/qryresult.aspx",
    params={"kw": "美麗晶華", "judtype": "JUDBOOK", "action": "q"},
    headers={"User-Agent": "Mozilla/5.0 Chrome/120.0.0.0"},
    verify=False,
    timeout=15,
)
soup = BeautifulSoup(r.text, "html.parser")

# 印出所有 script 標籤內容
print("=== INLINE SCRIPTS ===")
for i, sc in enumerate(soup.find_all("script")):
    src = sc.get("src", "")
    txt = sc.string or ""
    if not src and txt.strip():
        print(f"\n--- script #{i} ---")
        print(txt.strip()[:2000])

print("\n=== EXTERNAL JS FILES ===")
for sc in soup.find_all("script", src=True):
    print(sc["src"])
