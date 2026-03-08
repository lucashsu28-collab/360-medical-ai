"""
健保特約醫事機構查詢
API 不支援依名稱搜尋，需下載全量後本地比對。
"""
from pathlib import Path

import httpx

NHI_API = "https://info.nhi.gov.tw/api/iode0010/v1/rest/datastore/A21030000I-D21004-009"

_THIS_DIR = Path(__file__).resolve().parent
_DATA_DIR = _THIS_DIR.parent / "data"


async def download_all_clinics(limit: int = 1000) -> list:
    """下載全部健保特約診所資料（分頁取完）。"""
    all_records = []
    offset = 0
    async with httpx.AsyncClient(timeout=30, verify=False) as client:
        while True:
            resp = await client.get(NHI_API, params={
                "limit": limit,
                "offset": offset,
            })
            data = resp.json()
            records = data.get("result", {}).get("records", [])
            if not records:
                break
            all_records.extend(records)
            print(f"  已下載 {len(all_records)} 筆...")
            if len(records) < limit:
                break
            offset += limit
    return all_records
