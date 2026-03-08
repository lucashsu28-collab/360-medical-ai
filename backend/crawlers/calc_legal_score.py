import json
import unicodedata


def normalize(s: str) -> str:
    """全形轉半形、去空白、轉小寫"""
    s = unicodedata.normalize("NFKC", s or "")
    return s.replace(" ", "").replace("　", "").lower()


def name_match(a: str, b: str) -> bool:
    """診所名稱模糊比對：normalize後，其中一個包含另一個"""
    na, nb = normalize(a), normalize(b)
    return na in nb or nb in na


def address_match(a: str, b: str) -> bool:
    """地址比對：取前10字 normalize 後比對"""
    na, nb = normalize(a)[:10], normalize(b)[:10]
    return na == nb or (len(na) > 5 and na in nb) or (len(nb) > 5 and nb in na)


if __name__ == "__main__":
    with open('backend/data/clinics_real.json', encoding='utf-8') as f:
        clinics = json.load(f)

    # 健保特約名單：用名稱模糊比對，不再以 CLOSESHOP 判斷停業
    try:
        with open('backend/data/nhi_all.json', encoding='utf-8') as f:
            nhi_all = json.load(f)
    except FileNotFoundError:
        nhi_all = []

    for clinic in clinics:
        clinic_name = clinic.get('name') or ''
        matched = next(
            (r for r in nhi_all if name_match(clinic_name, r.get('HOSP_NAME', ''))),
            None,
        )
        if matched:
            legal_score = 10.0
            legal_status = "合法登記營業中"
            clinic['hosp_id'] = matched.get('HOSP_ID', '')
        else:
            legal_score = 5.0
            legal_status = "無法驗證"
            clinic['hosp_id'] = clinic.get('hosp_id', '')

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
