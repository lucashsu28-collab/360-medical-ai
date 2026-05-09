"""媒體權威度查表服務

依 docs/REPUTATION_SCORING.md 定義：
  A 級 主流媒體      ×1.5  蘋果/聯合/自由/中時/TVBS/鏡週刊
  B 級 網路媒體      ×1.2  ETtoday/三立/東森/Yahoo/風傳媒/新頭殼/NOWnews
  C 級 醫美專業      ×1.0  美人圈/醫美時尚/ELLE/美麗佳人
  D 級 內容農場      ×0.5  自動辨識，沒在資料表內的全部歸 D

使用模組級 cache，避免每次查表都打 DB
"""
from __future__ import annotations

import re
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.media_authority import MediaAuthority


# (domain, weight, tier, media_name) 模組級 cache
_CACHE: list[tuple[str, float, str, str]] = []


async def _ensure_cache(session: AsyncSession) -> None:
    global _CACHE
    if _CACHE:
        return
    rows = (await session.execute(
        select(MediaAuthority).where(MediaAuthority.is_active.is_(True))
    )).scalars().all()
    _CACHE = [(m.domain.lower(), m.weight, m.tier, m.media_name or m.domain) for m in rows]


def reset_cache() -> None:
    global _CACHE
    _CACHE = []


def _extract_domain(url: str) -> str:
    """從 URL 取出主機名（去掉 www. 前綴）"""
    if not url:
        return ""
    try:
        host = urlparse(url).hostname or ""
    except Exception:
        return ""
    host = host.lower()
    if host.startswith("www."):
        host = host[4:]
    return host


async def lookup_authority(
    session: AsyncSession,
    url: str,
) -> tuple[float, str, str]:
    """
    查詢媒體權威度
    返回 (weight, tier, media_name)
    沒查到的 domain 預設 D 級 (×0.5, 'Unknown')
    """
    await _ensure_cache(session)
    host = _extract_domain(url)
    if not host:
        return 0.5, "D", "Unknown"

    # 先試精確匹配
    for domain, weight, tier, name in _CACHE:
        if host == domain or host.endswith("." + domain):
            return weight, tier, name

    # 沒找到 → D 級
    return 0.5, "D", host
