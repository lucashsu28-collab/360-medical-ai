import httpx
import json
import os
import asyncio

PLACES_API_KEY = "AIzaSyCarq1kOV9dxLD6yJURAuLZHQLi-CpiE6c"
PLACES_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
PLACES_DETAIL_URL = "https://maps.googleapis.com/maps/api/place/details/json"

async def get_clinic_places_info(name: str, address: str) -> dict:
    """用診所名稱+地址查 Google Places 評分"""
    query = f"{name} {address[:15]}"
    async with httpx.AsyncClient(timeout=10) as client:
        # Step1: 找 place_id
        r = await client.get(PLACES_SEARCH_URL, params={
            "input": query,
            "inputtype": "textquery",
            "fields": "place_id,name,rating,user_ratings_total",
            "language": "zh-TW",
            "key": PLACES_API_KEY
        })
        data = r.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return {"found": False}
        
        place = candidates[0]
        place_id = place.get("place_id")
        
        # Step2: 取詳細資料
        r2 = await client.get(PLACES_DETAIL_URL, params={
            "place_id": place_id,
            "fields": "name,rating,user_ratings_total,formatted_phone_number,website,opening_hours",
            "language": "zh-TW",
            "key": PLACES_API_KEY
        })
        detail = r2.json().get("result", {})
        
        return {
            "found": True,
            "place_id": place_id,
            "google_name": detail.get("name"),
            "rating": detail.get("rating"),
            "review_count": detail.get("user_ratings_total"),
            "phone": detail.get("formatted_phone_number"),
            "website": detail.get("website"),
        }

# 測試用
async def test():
    result = await get_clinic_places_info("泛亞皮膚科整形外科診所", "臺北市松山區復興北路")
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(test())
