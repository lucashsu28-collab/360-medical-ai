import httpx, re, sys
sys.stdout.reconfigure(encoding="utf-8")
import warnings
warnings.filterwarnings("ignore")
from bs4 import BeautifulSoup

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
soup = BeautifulSoup(r.text, "html.parser")

# 找「查詢結果」附近的原始HTML
idx = r.text.find("查詢結果")
print("=== 查詢結果 附近 HTML ===")
print(r.text[idx - 50 : idx + 500])
print()

# 找所有含純數字的 span/div/label
print("=== 含純數字的元素 ===")
for tag in soup.find_all(["span", "label", "div", "input"]):
    txt = tag.get_text(strip=True)
    val = tag.get("value", "")
    cls = tag.get("class", [])
    tid = tag.get("id", "")
    if re.match(r"^\d+$", txt) or re.match(r"^\d+$", str(val)):
        print(f"<{tag.name} id={tid!r} class={cls}> text={txt!r} value={val!r}")
