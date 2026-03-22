import httpx, sys, warnings
sys.stdout.reconfigure(encoding="utf-8")
warnings.filterwarnings("ignore")

base = "https://judgment.judicial.gov.tw/FJUD"
for fname in ["functions.js", "leftresult.js"]:
    r = httpx.get(f"{base}/js/{fname}", verify=False, timeout=10)
    print(f"=== {fname} ===")
    print(r.text[:6000])
    print("\n\n")
