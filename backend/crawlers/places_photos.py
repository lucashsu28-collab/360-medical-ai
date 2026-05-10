"""Google Places Photos 同步

對每筆有 google_place_id 的診所：
  1. Place Details API 加 'photos' field 拿 photo_references 陣列
  2. Place Photos API 給 photo_reference 取真實 URL（302 redirect 到 lh3.googleusercontent.com）
  3. 存入 clinics.google_photo_url

成本：
  - 每筆 1 次 details + 1 次 photo redirect ≈ $0.025
  - 904 家全跑一次 ≈ $22 USD

Photos URL（lh3 CDN）通常穩定數月，建議每月 sync 一次。
"""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any

import httpx
from sqlalchemy import select, update

from database import AsyncSessionLocal
from models.clinic import Clinic


PLACES_API_KEY = "AIzaSyCarq1kOV9dxLD6yJURAuLZHQLi-CpiE6c"
DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
PHOTO_URL = "https://maps.googleapis.com/maps/api/place/photo"
SEARCH_URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"


async def _resolve_place_id(client: httpx.AsyncClient, name: str, address: str) -> str | None:
    """沒 place_id 時，用 name + address 找一次"""
    if not name:
        return None
    query = f"{name} {(address or '')[:20]}"
    try:
        r = await client.get(SEARCH_URL, params={
            "input": query,
            "inputtype": "textquery",
            "fields": "place_id",
            "language": "zh-TW",
            "key": PLACES_API_KEY,
        })
        candidates = r.json().get("candidates", [])
        return candidates[0].get("place_id") if candidates else None
    except Exception as e:
        print(f"[places_photos] resolve place_id error: {e}")
        return None


async def _fetch_photo_url(client: httpx.AsyncClient, place_id: str, max_width: int = 800) -> str | None:
    """取得診所第一張 photo 的 lh3 CDN URL"""
    if not place_id:
        return None
    try:
        # Step 1: place details with photos field
        r = await client.get(DETAILS_URL, params={
            "place_id": place_id,
            "fields": "photos",
            "language": "zh-TW",
            "key": PLACES_API_KEY,
        })
        result = r.json().get("result", {})
        photos = result.get("photos") or []
        if not photos:
            return None
        photo_ref = photos[0].get("photo_reference")
        if not photo_ref:
            return None

        # Step 2: photo API → 302 redirect 取最終 URL
        photo_resp = await client.get(PHOTO_URL, params={
            "photo_reference": photo_ref,
            "maxwidth": max_width,
            "key": PLACES_API_KEY,
        }, follow_redirects=False)
        if photo_resp.status_code in (301, 302, 303, 307, 308):
            return photo_resp.headers.get("location")
        # 偶爾 google 直接 return 200（直接吐 image bytes）— 用 photo API URL 即可（前端會 redirect）
        return None
    except Exception as e:
        print(f"[places_photos] fetch error for {place_id}: {e}")
        return None


async def sync_clinic_photos(batch_size: int = 30) -> dict:
    """同步：批次 sync 沒 photo URL 的診所"""
    async with AsyncSessionLocal() as session, httpx.AsyncClient(timeout=15.0) as client:
        # 優先處理：有 place_id 但沒 photo_url 的
        rows = (await session.execute(
            select(Clinic)
            .where(Clinic.google_photo_url.is_(None))
            .where(Clinic.google_place_id.isnot(None))
            .limit(batch_size)
        )).scalars().all()

        # 不夠再撈完全沒 place_id 的（要先 search）
        remaining = batch_size - len(rows)
        if remaining > 0:
            extras = (await session.execute(
                select(Clinic)
                .where(Clinic.google_photo_url.is_(None))
                .where(Clinic.google_place_id.is_(None))
                .where(Clinic.is_partner.is_(True))  # 沒 place_id 時優先合作診所（節流）
                .limit(remaining)
            )).scalars().all()
            rows.extend(extras)

        ok = 0
        no_photo = 0
        no_place_id = 0
        now = datetime.utcnow()

        for c in rows:
            place_id = c.google_place_id
            if not place_id:
                place_id = await _resolve_place_id(client, c.name, c.address or "")
                if place_id:
                    c.google_place_id = place_id
                else:
                    no_place_id += 1
                    continue

            photo_url = await _fetch_photo_url(client, place_id)
            if photo_url:
                c.google_photo_url = photo_url
                ok += 1
            else:
                no_photo += 1
            c.google_photo_synced_at = now
            await asyncio.sleep(0.1)  # 輕量節流

        await session.commit()
        return {
            "processed": len(rows),
            "got_photo": ok,
            "no_photo": no_photo,
            "no_place_id": no_place_id,
        }


if __name__ == "__main__":
    print(asyncio.run(sync_clinic_photos(batch_size=10)))
