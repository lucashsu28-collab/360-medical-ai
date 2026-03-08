import json

with open('backend/data/clinics_real.json', encoding='utf-8') as f:
    clinics = json.load(f)

for clinic in clinics:
    hosp_id = clinic.get('hosp_id', '')
    closeshop = clinic.get('is_active')  # is_active = CLOSESHOP == ""

    if hosp_id and clinic.get('is_active') != False:
        legal_score = 10.0
        legal_status = "合法登記營業中"
    elif hosp_id and clinic.get('is_active') == False:
        # is_active=False 表示 CLOSESHOP 有值（已停業）
        legal_score = 3.0
        legal_status = "已停業或撤銷"
    else:
        legal_score = 5.0
        legal_status = "無法驗證"

    clinic['legal_score'] = legal_score
    clinic['legal_status'] = legal_status

    # 重新計算綜合評分（加入合法登記）
    breakdown = clinic.get('score_breakdown') or {}
    google_score = breakdown.get('google', 0)
    review_bonus = breakdown.get('review_bonus', 0)
    # 綜合 = Google評分60% + 合法登記40%
    new_score = round(google_score * 0.6 + legal_score * 0.4, 1)
    clinic['score'] = min(new_score, 10.0)
    if 'score_breakdown' not in clinic:
        clinic['score_breakdown'] = {}
    clinic['score_breakdown']['legal'] = legal_score

with open('backend/data/clinics_real.json', 'w', encoding='utf-8') as f:
    json.dump(clinics, f, ensure_ascii=False, indent=2)

print("完成！前5筆：")
for c in clinics[:5]:
    print(f"  {c['name']} | 合法:{c['legal_score']} {c['legal_status']} | 綜合:{c['score']}")
