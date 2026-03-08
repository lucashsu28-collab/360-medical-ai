import asyncio
import json
import os
from crawlers.google_places import get_clinic_places_info

async def run():
    # 讀取前50家
    with open('backend/data/clinics_real.json', encoding='utf-8') as f:
        clinics = json.load(f)[:50]
    
    results = {}
    for i, clinic in enumerate(clinics):
        print(f"[{i+1}/50] {clinic['name']}...")
        try:
            info = await get_clinic_places_info(
                clinic['name'], 
                clinic['address']
            )
            results[clinic['id']] = info
            if info.get('found'):
                print(f"  [OK] 評分:{info.get('rating')} 評論:{info.get('review_count')}")
            else:
                print(f"  [--] 找不到")
        except Exception as e:
            results[clinic['id']] = {"found": False, "error": str(e)}
            print(f"  [!!] 錯誤: {e}")
        
        await asyncio.sleep(0.5)  # 避免超過API限制
    
    with open('backend/data/places_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    found = sum(1 for v in results.values() if v.get('found'))
    print(f"\n完成！找到 {found}/50 家的 Google 評分")

if __name__ == "__main__":
    asyncio.run(run())
