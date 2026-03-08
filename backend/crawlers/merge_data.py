import json

# 讀取資料
with open('backend/data/clinics_real.json', encoding='utf-8') as f:
    clinics = json.load(f)

with open('backend/data/places_results.json', encoding='utf-8') as f:
    places = json.load(f)

# 合併
for clinic in clinics[:50]:
    p = places.get(clinic['id'], {})
    if p.get('found'):
        clinic['google_rating'] = p.get('rating')
        clinic['google_review_count'] = p.get('review_count')
        clinic['google_place_id'] = p.get('place_id')
        clinic['website'] = p.get('website') or clinic.get('website', '')
        clinic['phone'] = p.get('phone') or clinic.get('phone', '')
        # 計算簡易綜合評分（之後加入更多維度）
        rating = p.get('rating') or 0
        reviews = p.get('review_count') or 0
        # Google評分轉換成10分制，評論數加權
        google_score = round(rating * 2, 1)  # 5分 -> 10分
        review_bonus = min(reviews / 100, 1.0)  # 最多加1分
        clinic['score'] = round(min(google_score + review_bonus, 10.0), 1)
        clinic['score_breakdown'] = {
            "google": google_score,
            "review_bonus": round(review_bonus, 2)
        }

# 存回
with open('backend/data/clinics_real.json', 'w', encoding='utf-8') as f:
    json.dump(clinics, f, ensure_ascii=False, indent=2)

print("合併完成！前5筆：")
for c in clinics[:5]:
    print(f"  {c['name']} | Google:{c.get('google_rating')} | 評論:{c.get('google_review_count')} | 綜合:{c.get('score')}")
