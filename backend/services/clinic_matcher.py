"""診所名稱 fuzzy match —— 把爬蟲抓到的「XX醫美診所」對應到 clinics.id

使用 rapidfuzz WRatio scorer，通過率約 90%+。匹配分數 < 85 進人工確認佇列。
"""
from __future__ import annotations

from typing import Tuple

from rapidfuzz import fuzz, process
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.clinic import Clinic

# 模組級 cache —— 避免每筆記錄都查 904 家診所
# 結構：[(normalized_name, original_name, clinic_id), ...]
_CACHE: list[tuple[str, str, str]] = []

# 名稱正規化要剝除的雜訊詞
_NOISE_TOKENS = [
    "醫療財團法人",
    "財團法人",
    "醫療社團法人",
    "社團法人",
    "股份有限公司",
    "有限公司",
    "（", "）", "(", ")", " ", "　",
]


def _normalize(name: str) -> str:
    if not name:
        return ""
    for tok in _NOISE_TOKENS:
        name = name.replace(tok, "")
    return name.strip()


async def _ensure_cache(session: AsyncSession) -> None:
    global _CACHE
    if _CACHE:
        return
    result = await session.execute(select(Clinic.id, Clinic.name))
    rows = result.all()
    _CACHE = [
        (_normalize(name), name, cid)
        for cid, name in rows
        if name
    ]


def reset_cache() -> None:
    """新增/修改診所後須呼叫，下次比對才會重新載入"""
    global _CACHE
    _CACHE = []


async def match_clinic(
    session: AsyncSession,
    raw_name: str,
    threshold: int = 85,
) -> str | None:
    """快速比對；分數低於 threshold 直接回 None"""
    cid, score = await match_clinic_with_score(session, raw_name)
    return cid if score >= threshold else None


async def match_clinic_with_score(
    session: AsyncSession,
    raw_name: str,
) -> Tuple[str | None, int]:
    """回傳 (clinic_id 或 None, fuzz score 0-100)；給人工確認佇列用"""
    if not raw_name:
        return None, 0

    await _ensure_cache(session)
    if not _CACHE:
        return None, 0

    norm = _normalize(raw_name)
    if not norm:
        return None, 0

    names_only = [c[0] for c in _CACHE]
    best = process.extractOne(norm, names_only, scorer=fuzz.WRatio)
    if not best:
        return None, 0

    _, score, idx = best
    return _CACHE[idx][2], int(score)
