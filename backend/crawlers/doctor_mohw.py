from bs4 import BeautifulSoup
import httpx
import asyncio

SEARCH_URL = "https://ma.mohw.gov.tw/Accessibility/DOCSearch/DocResults"
DETAIL_URL = "https://ma.mohw.gov.tw/Accessibility/DOCSearch/DOCBasicData"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://ma.mohw.gov.tw/Accessibility/DOCSearch/MASearchDOC",
}


async def search_doctor(name: str) -> list:
    async with httpx.AsyncClient(timeout=15, verify=False, follow_redirects=True) as client:
        resp = await client.post(
            SEARCH_URL,
            headers=HEADERS,
            data={
                "DOC_NAME": name,
                "DOC_TYPE": "",
                "AREA_NO": "",
                "CAPTCHA": "",
            },
        )

    soup = BeautifulSoup(resp.text, "html.parser")

    results = []
    for row in soup.select("#docTable tbody tr"):
        cells = row.find_all("td")
        if len(cells) < 4:
            continue
        link = cells[3].find("a")
        if not link:
            continue
        doc_seq = link["href"].split("DOC_SEQ=")[-1]
        results.append({
            "name": cells[1].get_text(strip=True),
            "area": cells[2].get_text(strip=True),  # 執業縣市
            "doc_seq": doc_seq,
        })

    return results


async def get_doctor_detail(doc_seq: str) -> dict:
    import httpx
    from bs4 import BeautifulSoup

    url = f"{DETAIL_URL}?DOC_SEQ={doc_seq}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-TW,zh;q=0.9",
        "Referer": "https://ma.mohw.gov.tw/Accessibility/DOCSearch/MASearchDOC",
    }
    async with httpx.AsyncClient(timeout=15, verify=False, follow_redirects=True) as client:
        resp = await client.get(url, headers=headers)

    soup = BeautifulSoup(resp.text, "html.parser")
    data = {}
    for row in soup.select("div.row.fontsize"):
        spans = row.find_all("span", recursive=False)  # 只取直接子 span
        if not spans:
            # 改找所有 span
            spans = row.find_all("span")
        # 找 col-3 的 span 當 key
        key_span = row.find("span", class_="col-3")
        if not key_span:
            continue
        key = key_span.get_text(strip=True).rstrip("：:")
        # value 是 key_span 的下一個 sibling span
        val_span = key_span.find_next_sibling("span")
        if val_span:
            data[key] = val_span.get_text(strip=True)

    print("解析結果：", data)
    print("全部欄位：", list(data.keys()))
    return data


async def test():
    results = await search_doctor("陳志宇")
    print(f"找到 {len(results)} 筆")
    for r in results:
        print(f"  {r}")

    if results and results[0]["doc_seq"]:
        detail = await get_doctor_detail(results[0]["doc_seq"])
        print("\n詳細資料：")
        for k, v in detail.items():
            print(f"  {k}: {v}")


if __name__ == "__main__":
    asyncio.run(test())
