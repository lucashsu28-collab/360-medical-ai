"""
對話狀態：Redis 儲存結構。
"""
import json
from typing import Any


def default_state() -> dict[str, Any]:
    return {
        "stage": 1,
        "district": "",
        "treatmentType": "",
        "budget": "",
        "interestedClinicId": "",
    }


def state_from_redis(data: bytes | str | None) -> dict[str, Any]:
    """從 Redis 讀出的值轉成 state dict。"""
    if data is None:
        return default_state()
    if isinstance(data, bytes):
        data = data.decode("utf-8")
    try:
        d = json.loads(data)
        return {
            "stage": d.get("stage", 1),
            "district": d.get("district", "") or "",
            "treatmentType": d.get("treatmentType", "") or "",
            "budget": d.get("budget", "") or "",
            "interestedClinicId": d.get("interestedClinicId", "") or "",
        }
    except (TypeError, ValueError):
        return default_state()
