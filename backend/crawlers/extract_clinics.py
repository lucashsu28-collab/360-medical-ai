import json
import random

with open('backend/data/nhi_all.json', encoding='utf-8') as f:
    data = json.load(f)

keywords = ['醫美', '美學', '皮膚科', '整形', '整型', '美容', '雷射', '醫學美容']
results = []
for r in data:
    name = r.get('HOSP_NAME', '')
    func = r.get('FUNCTYPE_CNAME', '')
    for kw in keywords:
        if kw in name or kw in func:
            results.append(r)
            break

# 轉成我們系統的格式
clinics = []
for i, r in enumerate(results):
    clinic = {
        "id": f"c{str(i+1).zfill(3)}",
        "name": r.get("HOSP_NAME", ""),
        "address": r.get("ADDRESS", ""),
        "phone": r.get("TEL", ""),
        "specialty": r.get("FUNCTYPE_CNAME", ""),
        "hosp_id": r.get("HOSP_ID", ""),
        "cont_start": r.get("CONT_S_DATE", ""),
        "is_active": r.get("CLOSESHOP", "") == "",
        # 以下欄位之後用其他來源補
        "score": None,
        "isPartner": False,
        "treatments": [],
        "doctors": []
    }
    clinics.append(clinic)

# 存全量
with open('backend/data/clinics_real.json', 'w', encoding='utf-8') as f:
    json.dump(clinics, f, ensure_ascii=False, indent=2)

print(f"共 {len(clinics)} 家，存到 backend/data/clinics_real.json")
print("前5筆：")
for c in clinics[:5]:
    print(f"  {c['id']} {c['name']} | {c['address'][:30]}")
