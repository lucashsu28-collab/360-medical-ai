"""
衛福部醫事機構查詢。
查詢端點：醫事查詢系統 https://ma.mohw.gov.tw/ 或 健保署 https://www.nhi.gov.tw/QueryN/Query1.aspx
結果快取至 backend/data/mohw_cache.json。
"""
import json
import re
from pathlib import Path
from typing import Any

import httpx

# 快取檔路徑：backend/data/mohw_cache.json
_THIS_DIR = Path(__file__).resolve().parent
_DATA_DIR = _THIS_DIR.parent / "data"
CACHE_PATH = _DATA_DIR / "mohw_cache.json"

# 查詢時使用的 User-Agent，避免被擋
_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def _load_cache() -> dict[str, list[dict[str, Any]]]:
    """讀取快取：key 為查詢名稱，value 為結果列表。"""
    if not CACHE_PATH.exists():
        return {}
    try:
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _save_cache(cache: dict[str, list[dict[str, Any]]]) -> None:
    """寫入快取。"""
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def _fetch_mohw(name: str) -> list[dict[str, Any]]:
    """
    向衛福部／健保署查詢醫事機構（依名稱）。
    若端點不可用或回傳非預期格式，回傳空列表；可後續改為解析 HTML 或改用開放資料 API。
    """
    results: list[dict[str, Any]] = []
    # 醫事查詢系統機構查詢（實際為 ASP 表單，需帶 ViewState 等；此處先嘗試 GET 取得頁面後再 POST）
    url = "https://ma.mohw.gov.tw/Accessibility/BASSearch/MASearchBAS/"
    try:
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            client.headers["User-Agent"] = _USER_AGENT
            # 先 GET 取表單與 __VIEWSTATE
            r = client.get(url)
            if r.status_code != 200:
                return results
            html = r.text
            # 簡易解析：若頁面內含機構名稱或表格，可在此用 regex 或 BeautifulSoup 解析
            # 此處僅示範：若回應內含查詢關鍵字且出現「開業」等字樣，可嘗試擷取
            # 實際建議改用政府資料開放平台之資料集或確認 POST 參數後再實作
            viewstate = ""
            match = re.search(r'id="__VIEWSTATE"\s+value="([^"]*)"', html)
            if match:
                viewstate = match.group(1)
            # POST 查詢（表單欄位名需依實際網頁調整）
            post_data: dict[str, str] = {
                "__VIEWSTATE": viewstate,
                "__EVENTTARGET": "",
                "__EVENTARGUMENT": "",
            }
            # 機構名稱欄位（常見命名）
            for key in ["txtBASName", "Keyword", "tbxOrgName", "name"]:
                post_data[key] = name
            r2 = client.post(url, data=post_data)
            if r2.status_code != 200:
                return results
            # TODO: 解析 r2.text 取得機構列表，填入 results
            # 範例：results.append({"name": "...", "license_number": "...", ...})
    except (httpx.HTTPError, OSError):
        pass
    return results


def _normalize_result(item: dict[str, Any]) -> dict[str, Any]:
    """確保回傳結構含所需欄位。"""
    return {
        "name": item.get("name") or "",
        "license_number": item.get("license_number") or "",
        "address": item.get("address") or "",
        "status": item.get("status") or "",
        "doctor_count": int(item.get("doctor_count", 0)) if item.get("doctor_count") is not None else 0,
        "is_valid": bool(item.get("is_valid", True)),
    }


def search_clinic(name: str) -> list[dict[str, Any]]:
    """
    依診所名稱查詢衛福部醫事機構，結果快取至 backend/data/mohw_cache.json。

    回傳列表，每筆為：
    - name: 機構名稱
    - license_number: 開業執照號
    - address: 地址
    - status: 開業中/停業/撤銷
    - doctor_count: 醫師人數
    - is_valid: 是否為有效開業中
    """
    name = (name or "").strip()
    if not name:
        return []

    cache = _load_cache()
    cache_key = name
    if cache_key in cache:
        return [_normalize_result(r) for r in cache[cache_key]]

    results = _fetch_mohw(name)
    # 若遠端無結果，仍寫入快取避免重複請求
    cache[cache_key] = results
    _save_cache(cache)

    return [_normalize_result(r) for r in results]
