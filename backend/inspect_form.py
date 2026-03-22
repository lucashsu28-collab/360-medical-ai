import httpx, sys, warnings
sys.stdout.reconfigure(encoding="utf-8")
warnings.filterwarnings("ignore")
from bs4 import BeautifulSoup

r = httpx.get("https://judgment.judicial.gov.tw/FJUD/default.aspx", verify=False)
soup = BeautifulSoup(r.text, "html.parser")

for form in soup.find_all("form"):
    action = form.get("action", "")
    method = form.get("method", "")
    print(f"FORM action={action} method={method}")
    for inp in form.find_all(["input", "select", "textarea", "button"]):
        name = inp.get("name", "")
        typ = inp.get("type", "")
        val = str(inp.get("value", ""))[:40]
        tid = inp.get("id", "")
        print(f"  <{inp.name}> id={tid!r} name={name!r} type={typ!r} value={val!r}")
