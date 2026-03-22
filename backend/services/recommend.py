"""
推薦診所：從 backend/data/clinics_real.json 讀取真實診所，格式化給 Gemini 使用。
"""
import json
import os
from typing import Any

_data_path = os.path.join(os.path.dirname(__file__), "../data/clinics_real.json")


def _load_clinics() -> list[dict[str, Any]]:
    with open(_data_path, encoding="utf-8") as f:
        return json.load(f)


CLINICS = _load_clinics()
_CLINIC_INDEX: dict[str, dict[str, Any]] = {c["id"]: c for c in CLINICS}


def get_clinic_by_id(clinic_id: str) -> dict[str, Any] | None:
    # 先嘗試從 PostgreSQL 查
    try:
        from config import DATABASE_URL
        from sqlalchemy import create_engine, text
        db_url = (
            DATABASE_URL
            .replace("postgresql+asyncpg://", "postgresql+psycopg2://")
            .replace("postgresql://", "postgresql+psycopg2://")
        )
        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            # 先精確查 id
            row = conn.execute(text("SELECT * FROM clinics WHERE id = :id"), {"id": clinic_id}).fetchone()
            # 找不到就查 mock index（c001~c999 對應真實診所順序）
            if not row and clinic_id.startswith("c") and clinic_id[1:].isdigit():
                idx = int(clinic_id[1:]) - 1
                row = conn.execute(text("SELECT * FROM clinics ORDER BY id LIMIT 1 OFFSET :offset"), {"offset": idx}).fetchone()
            if row:
                return dict(row._mapping)
    except Exception as e:
        print(f"[get_clinic_by_id] DB error: {e}")

    # fallback: JSON
    return _CLINIC_INDEX.get(clinic_id)


def get_all_clinics() -> list[dict[str, Any]]:
    return CLINICS


def _district_from_address(address: str) -> str:
    if not address or "區" not in address:
        return ""
    return address[: address.index("區") + 1]


def get_partner_clinics(
    district: str | None = None,
    treatment_type: str | None = None,
) -> list[dict[str, Any]]:
    """
    查詢合作診所：isPartner 為 True 且 score >= 7.5（或 score 為 None 時也列入）。
    支援篩選：district（對應 address）、treatment_type（對應 specialty / treatments）。
    回傳欄位：id, name, district, score_total, tags, dispute_count。
    """
    base = [
        c for c in CLINICS
        if c.get("isPartner") is True
        and (c.get("score") is None or (c.get("score") or 0) >= 7.5)
    ]
    if district and district.strip():
        key = district.strip()
        base = [
            c for c in base
            if key in (c.get("address") or "") or key in _district_from_address(c.get("address") or "")
        ]
    if treatment_type and treatment_type.strip():
        key = treatment_type.strip()
        tags = (c.get("treatments") or []) + ([c.get("specialty")] if c.get("specialty") else [])
        base = [c for c in base if any(key in (t or "") for t in tags)]
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "district": _district_from_address(c.get("address") or ""),
            "score_total": c.get("score") if c.get("score") is not None else 0,
            "tags": c.get("treatments") or ([c["specialty"]] if c.get("specialty") else []),
            "dispute_count": 0,
        }
        for c in base
    ]


def format_clinics_for_prompt(clinics: list[dict[str, Any]]) -> str:
    """
    將診所列表格式化成給 Gemini 讀的文字，例如：
    【推薦診所清單】
    1. 信義旗艦醫美｜台北市信義區｜評分 9.5｜無糾紛｜皮秒雷射/玻尿酸
    """
    if not clinics:
        return "【推薦診所清單】\n目前無符合條件的合作診所，請勿推薦任何診所。"
    lines = ["【推薦診所清單】"]
    by_id = {c["id"]: c for c in CLINICS}
    for i, c in enumerate(clinics, 1):
        name = c.get("name") or ""
        district = c.get("district") or ""
        full = by_id.get(c["id"], c)
        addr = full.get("address") or ""
        region = _district_from_address(addr) if addr else district
        score = c.get("score_total") if "score_total" in c else full.get("score")
        score_str = f"評分 {score:.1f}" if isinstance(score, (int, float)) else "評分 —"
        dispute = c.get("dispute_count", 0)
        dispute_str = "有糾紛紀錄" if dispute else "無糾紛"
        tags = c.get("tags") or full.get("treatments") or ([full.get("specialty")] if full.get("specialty") else [])
        tags_str = "/".join((t or "") for t in tags[:6] if t) if tags else "—"
        lines.append(f"{i}. {name}｜{region}｜{score_str}｜{dispute_str}｜{tags_str}")
    return "\n".join(lines)


# 完整診所資料（含五維度 scores），供 get_clinic_by_id / format_full_report 使用
CLINICS_FULL: list[dict[str, Any]] = [
    {"id": "c01", "name": "晶緻醫美診所", "type": "醫美診所", "address": "台北市信義區忠孝東路五段123號", "district": "信義區", "tags": ["皮秒雷射", "玻尿酸", "肉毒桿菌"], "is_partner": True, "score_total": 9.4, "dispute_count": 0, "scores": {"judicial": 9.6, "google": 9.2, "legal": 10.0, "media": 8.8, "social": 9.0, "total": 9.4}, "review_count": 1247},
    {"id": "c02", "name": "璞真整形外科診所", "type": "整形外科", "address": "台北市大安區敦化南路一段88號", "district": "大安區", "tags": ["雙眼皮", "隆鼻", "拉皮", "縮鼻翼"], "is_partner": True, "score_total": 8.9, "dispute_count": 0, "scores": {"judicial": 10.0, "google": 8.8, "legal": 10.0, "media": 8.5, "social": 8.2, "total": 8.9}, "review_count": 983},
    {"id": "c03", "name": "悅顏皮膚科診所", "type": "皮膚科", "address": "台北市中山區中山北路二段33號", "district": "中山區", "tags": ["皮秒", "淡斑", "痘疤", "保濕療程"], "is_partner": True, "score_total": 8.7, "dispute_count": 0, "scores": {"judicial": 9.5, "google": 8.7, "legal": 10.0, "media": 7.8, "social": 9.0, "total": 8.7}, "review_count": 756},
    {"id": "c04", "name": "凰漾美學診所", "type": "醫美診所", "address": "新北市板橋區文化路一段56號", "district": "板橋區", "tags": ["電波拉皮", "超音波", "體雕"], "is_partner": True, "score_total": 9.1, "dispute_count": 0, "scores": {"judicial": 9.8, "google": 8.4, "legal": 10.0, "media": 8.2, "social": 7.9, "total": 9.1}, "review_count": 512},
    {"id": "c05", "name": "臻美整形診所", "type": "整形外科", "address": "台北市松山區民生東路三段142號", "district": "松山區", "tags": ["抽脂", "豐胸", "腹部整形"], "is_partner": False, "score_total": 9.1, "dispute_count": 0, "scores": {"judicial": 9.2, "google": 9.1, "legal": 10.0, "media": 8.0, "social": 8.6, "total": 9.1}, "review_count": 389},
    {"id": "c06", "name": "光澤皮膚科診所", "type": "皮膚科", "address": "台北市內湖區瑞光路288號", "district": "內湖區", "tags": ["飛梭雷射", "淨膚", "光子嫩膚"], "is_partner": True, "score_total": 8.8, "dispute_count": 0, "scores": {"judicial": 10.0, "google": 8.6, "legal": 10.0, "media": 7.5, "social": 8.8, "total": 8.8}, "review_count": 634},
    {"id": "c07", "name": "薇采醫美診所", "type": "醫美診所", "address": "台北市士林區中山北路六段55號", "district": "士林區", "tags": ["玻尿酸", "童顏針", "晶亮瓷"], "is_partner": True, "score_total": 8.9, "dispute_count": 0, "scores": {"judicial": 9.0, "google": 8.9, "legal": 10.0, "media": 8.3, "social": 8.7, "total": 8.9}, "review_count": 478},
    {"id": "c08", "name": "湛藍整形外科診所", "type": "整形外科", "address": "台北市中正區羅斯福路二段77號", "district": "中正區", "tags": ["鼻整形", "眼整形", "臉部輪廓"], "is_partner": False, "score_total": 8.3, "dispute_count": 0, "scores": {"judicial": 8.5, "google": 8.2, "legal": 10.0, "media": 7.0, "social": 7.8, "total": 8.3}, "review_count": 291},
    {"id": "c09", "name": "千代醫美診所", "type": "醫美診所", "address": "新北市新莊區中正路500號", "district": "新莊區", "tags": ["美白針", "排毒療程", "皮膚管理"], "is_partner": False, "score_total": 7.7, "dispute_count": 0, "scores": {"judicial": 7.8, "google": 7.5, "legal": 10.0, "media": 6.8, "social": 7.2, "total": 7.7}, "review_count": 188},
    {"id": "c10", "name": "雙星皮膚科診所", "type": "皮膚科", "address": "台北市文山區木柵路三段22號", "district": "文山區", "tags": ["痘痘治療", "敏感修護", "痘疤雷射"], "is_partner": True, "score_total": 8.6, "dispute_count": 0, "scores": {"judicial": 9.8, "google": 8.3, "legal": 10.0, "media": 7.6, "social": 8.5, "total": 8.6}, "review_count": 423},
    {"id": "c11", "name": "禾澄醫美診所", "type": "醫美診所", "address": "桃園市中壢區中山路101號", "district": "中壢區", "tags": ["皮秒雷射", "電波拉皮", "玻尿酸"], "is_partner": True, "score_total": 8.8, "dispute_count": 0, "scores": {"judicial": 9.4, "google": 8.7, "legal": 10.0, "media": 8.0, "social": 8.4, "total": 8.8}, "review_count": 367},
    {"id": "c12", "name": "典雅整形外科診所", "type": "整形外科", "address": "台中市西屯區台灣大道三段888號", "district": "西屯區", "tags": ["雙眼皮", "臥蠶", "眼袋"], "is_partner": True, "score_total": 9.3, "dispute_count": 0, "scores": {"judicial": 9.6, "google": 9.0, "legal": 10.0, "media": 8.5, "social": 9.1, "total": 9.3}, "review_count": 812},
    {"id": "c13", "name": "森澤皮膚科診所", "type": "皮膚科", "address": "台中市北區學士路66號", "district": "北區", "tags": ["染料雷射", "紅血絲", "酒糟治療"], "is_partner": False, "score_total": 8.4, "dispute_count": 0, "scores": {"judicial": 8.8, "google": 8.1, "legal": 10.0, "media": 7.2, "social": 8.0, "total": 8.4}, "review_count": 234},
    {"id": "c14", "name": "絲漾醫美診所", "type": "醫美診所", "address": "台南市東區東門路一段200號", "district": "東區", "tags": ["超音波拉皮", "埋線拉提", "肉毒"], "is_partner": True, "score_total": 9.1, "dispute_count": 0, "scores": {"judicial": 9.9, "google": 8.8, "legal": 10.0, "media": 8.3, "social": 8.6, "total": 9.1}, "review_count": 556},
    {"id": "c15", "name": "悠美整形診所", "type": "整形外科", "address": "高雄市苓雅區四維三路33號", "district": "苓雅區", "tags": ["抽脂", "隆乳", "眼整形"], "is_partner": True, "score_total": 8.7, "dispute_count": 0, "scores": {"judicial": 9.2, "google": 8.5, "legal": 10.0, "media": 7.8, "social": 8.3, "total": 8.7}, "review_count": 445},
    {"id": "c16", "name": "煜美皮膚科診所", "type": "皮膚科", "address": "高雄市前鎮區中華五路1000號", "district": "前鎮區", "tags": ["除毛雷射", "美白", "保濕"], "is_partner": False, "score_total": 7.8, "dispute_count": 0, "scores": {"judicial": 8.0, "google": 7.8, "legal": 10.0, "media": 6.5, "social": 7.6, "total": 7.8}, "review_count": 167},
    {"id": "c17", "name": "凌頂醫美診所", "type": "醫美診所", "address": "新北市永和區中正路399號", "district": "永和區", "tags": ["皮秒雷射", "童顏針", "體雕減脂"], "is_partner": True, "score_total": 9.2, "dispute_count": 0, "scores": {"judicial": 9.7, "google": 8.9, "legal": 10.0, "media": 8.4, "social": 8.8, "total": 9.2}, "review_count": 689},
    {"id": "c18", "name": "蘭亭整形外科診所", "type": "整形外科", "address": "台北市信義區松仁路88號", "district": "信義區", "tags": ["全臉拉皮", "眉提術", "淚溝填補"], "is_partner": False, "score_total": 7.2, "dispute_count": 0, "scores": {"judicial": 7.2, "google": 7.0, "legal": 10.0, "media": 6.2, "social": 6.8, "total": 7.2}, "review_count": 98},
    {"id": "c19", "name": "晨曦皮膚科診所", "type": "皮膚科", "address": "桃園市桃園區復興路200號", "district": "桃園區", "tags": ["IPL光子", "淡斑", "縮毛孔"], "is_partner": True, "score_total": 8.8, "dispute_count": 0, "scores": {"judicial": 9.3, "google": 8.6, "legal": 10.0, "media": 7.9, "social": 8.7, "total": 8.8}, "review_count": 341},
    {"id": "c20", "name": "雅緻醫美診所", "type": "醫美診所", "address": "新北市三重區重新路五段609號", "district": "三重區", "tags": ["玻尿酸", "肉毒", "淨膚雷射"], "is_partner": False, "score_total": 6.9, "dispute_count": 0, "scores": {"judicial": 6.5, "google": 7.2, "legal": 10.0, "media": 5.8, "social": 6.9, "total": 6.9}, "review_count": 76},
]

FAKE_DOCTORS: list[dict[str, Any]] = [
    {"id": "d01", "name": "王明哲 醫師", "title": "整形外科專科醫師", "specialty": "整形外科", "clinic_id": "c02", "clinic_name": "璞真整形外科診所", "clinic_score": 8.9, "specs": ["皮秒雷射", "玻尿酸", "雙眼皮", "隆鼻"], "license_valid": True, "dispute_count": 0, "years_of_practice": 12, "district": "台北市"},
    {"id": "d02", "name": "李雅婷 醫師", "title": "皮膚科專科醫師", "specialty": "皮膚科", "clinic_id": "c03", "clinic_name": "悅顏皮膚科診所", "clinic_score": 8.7, "specs": ["皮秒", "淡斑", "痘疤", "皮膚管理"], "license_valid": True, "dispute_count": 0, "years_of_practice": 8, "district": "台北市"},
    {"id": "d03", "name": "陳志遠 醫師", "title": "整形外科專科醫師", "specialty": "整形外科", "clinic_id": "c02", "clinic_name": "璞真整形外科診所", "clinic_score": 8.9, "specs": ["雙眼皮", "隆鼻", "縮鼻翼", "拉皮"], "license_valid": True, "dispute_count": 0, "years_of_practice": 15, "district": "台北市"},
    {"id": "d04", "name": "林佩君 醫師", "title": "整形外科專科醫師", "specialty": "整形外科", "clinic_id": "c05", "clinic_name": "臻美整形診所", "clinic_score": 9.1, "specs": ["抽脂", "豐胸", "腹部整形"], "license_valid": True, "dispute_count": 1, "years_of_practice": 9, "district": "台北市"},
    {"id": "d05", "name": "張世豪 醫師", "title": "皮膚科專科醫師", "specialty": "皮膚科", "clinic_id": "c06", "clinic_name": "光澤皮膚科診所", "clinic_score": 8.8, "specs": ["飛梭雷射", "淨膚", "光子嫩膚", "除毛"], "license_valid": True, "dispute_count": 0, "years_of_practice": 11, "district": "台北市"},
    {"id": "d06", "name": "吳欣儀 醫師", "title": "醫學美容醫師", "specialty": "微整形", "clinic_id": "c01", "clinic_name": "晶緻醫美診所", "clinic_score": 9.4, "specs": ["玻尿酸", "肉毒桿菌", "晶亮瓷", "童顏針"], "license_valid": True, "dispute_count": 0, "years_of_practice": 7, "district": "台北市"},
    {"id": "d07", "name": "黃建民 醫師", "title": "整形外科專科醫師", "specialty": "整形外科", "clinic_id": "c12", "clinic_name": "典雅整形外科診所", "clinic_score": 9.3, "specs": ["雙眼皮", "臥蠶", "眼袋", "眼整形"], "license_valid": True, "dispute_count": 0, "years_of_practice": 18, "district": "台中市"},
    {"id": "d08", "name": "蔡宜蓉 醫師", "title": "皮膚科專科醫師", "specialty": "皮膚科", "clinic_id": "c10", "clinic_name": "雙星皮膚科診所", "clinic_score": 8.6, "specs": ["痘痘治療", "敏感修護", "痘疤雷射"], "license_valid": True, "dispute_count": 0, "years_of_practice": 6, "district": "台北市"},
    {"id": "d09", "name": "許志偉 醫師", "title": "整形外科專科醫師", "specialty": "整形外科", "clinic_id": "c15", "clinic_name": "悠美整形診所", "clinic_score": 8.7, "specs": ["抽脂", "隆乳", "眼整形", "腹部整形"], "license_valid": True, "dispute_count": 0, "years_of_practice": 13, "district": "高雄市"},
    {"id": "d10", "name": "劉芳如 醫師", "title": "醫學美容醫師", "specialty": "雷射", "clinic_id": "c11", "clinic_name": "禾澄醫美診所", "clinic_score": 8.8, "specs": ["皮秒雷射", "電波拉皮", "玻尿酸"], "license_valid": True, "dispute_count": 0, "years_of_practice": 5, "district": "桃園市"},
    {"id": "d11", "name": "鄭俊傑 醫師", "title": "整形外科專科醫師", "specialty": "整形外科", "clinic_id": "c08", "clinic_name": "湛藍整形外科診所", "clinic_score": 8.3, "specs": ["鼻整形", "眼整形", "臉部輪廓"], "license_valid": True, "dispute_count": 0, "years_of_practice": 10, "district": "台北市"},
    {"id": "d12", "name": "洪雅雯 醫師", "title": "皮膚科專科醫師", "specialty": "皮膚科", "clinic_id": "c13", "clinic_name": "森澤皮膚科診所", "clinic_score": 8.4, "specs": ["染料雷射", "紅血絲", "酒糟治療"], "license_valid": True, "dispute_count": 0, "years_of_practice": 9, "district": "台中市"},
    {"id": "d13", "name": "曾裕翔 醫師", "title": "醫學美容醫師", "specialty": "微整形", "clinic_id": "c14", "clinic_name": "絲漾醫美診所", "clinic_score": 9.1, "specs": ["超音波拉皮", "埋線拉提", "肉毒"], "license_valid": True, "dispute_count": 0, "years_of_practice": 8, "district": "台南市"},
    {"id": "d14", "name": "方淑芬 醫師", "title": "皮膚科專科醫師", "specialty": "皮膚科", "clinic_id": "c19", "clinic_name": "晨曦皮膚科診所", "clinic_score": 8.8, "specs": ["IPL光子", "淡斑", "縮毛孔"], "license_valid": True, "dispute_count": 0, "years_of_practice": 7, "district": "桃園市"},
    {"id": "d15", "name": "江文彥 醫師", "title": "整形外科專科醫師", "specialty": "整形外科", "clinic_id": "c17", "clinic_name": "凌頂醫美診所", "clinic_score": 9.2, "specs": ["皮秒雷射", "童顏針", "體雕減脂"], "license_valid": True, "dispute_count": 0, "years_of_practice": 14, "district": "新北市"},
    {"id": "d16", "name": "廖美珍 醫師", "title": "皮膚科專科醫師", "specialty": "皮膚科", "clinic_id": "c04", "clinic_name": "凰漾美學診所", "clinic_score": 9.1, "specs": ["電波拉皮", "超音波", "體雕"], "license_valid": True, "dispute_count": 0, "years_of_practice": 10, "district": "新北市"},
    {"id": "d17", "name": "謝承翰 醫師", "title": "整形外科專科醫師", "specialty": "整形外科", "clinic_id": "c18", "clinic_name": "蘭亭整形外科診所", "clinic_score": 7.2, "specs": ["全臉拉皮", "眉提術", "淚溝填補"], "license_valid": True, "dispute_count": 2, "years_of_practice": 16, "district": "台北市"},
    {"id": "d18", "name": "沈怡君 醫師", "title": "醫學美容醫師", "specialty": "雷射", "clinic_id": "c07", "clinic_name": "薇采醫美診所", "clinic_score": 8.9, "specs": ["玻尿酸", "童顏針", "晶亮瓷"], "license_valid": True, "dispute_count": 0, "years_of_practice": 6, "district": "台北市"},
    {"id": "d19", "name": "余昆霖 醫師", "title": "整形外科專科醫師", "specialty": "整形外科", "clinic_id": "c12", "clinic_name": "典雅整形外科診所", "clinic_score": 9.3, "specs": ["鼻整形", "下巴整形", "臉部輪廓"], "license_valid": True, "dispute_count": 0, "years_of_practice": 11, "district": "台中市"},
    {"id": "d20", "name": "潘靜宜 醫師", "title": "皮膚科專科醫師", "specialty": "皮膚科", "clinic_id": "c16", "clinic_name": "煜美皮膚科診所", "clinic_score": 7.8, "specs": ["除毛雷射", "美白", "保濕"], "license_valid": True, "dispute_count": 0, "years_of_practice": 4, "district": "高雄市"},
]


def get_doctor_by_id(doctor_id: str) -> dict[str, Any] | None:
    """依 id 取得醫師完整資料，找不到回傳 None。"""
    for d in FAKE_DOCTORS:
        if d.get("id") == doctor_id:
            return d
    return None


def format_full_report(clinic: dict[str, Any]) -> str:
    """回傳診所完整報告文字（支援 clinics_real 與舊 CLINICS_FULL 格式）。"""
    name = clinic.get("name") or ""
    address = clinic.get("address") or ""
    district = clinic.get("district") or _district_from_address(address)
    tags = clinic.get("tags") or clinic.get("treatments") or ([clinic.get("specialty")] if clinic.get("specialty") else [])
    tags_str = "、".join((t or "") for t in tags[:10] if t) if tags else "—"
    scores = clinic.get("scores") or {}
    total = scores.get("total") or clinic.get("score_total") or clinic.get("score") or 0
    judicial = scores.get("judicial", 0)
    google = scores.get("google", 0)
    legal = scores.get("legal", 0)
    media = scores.get("media", 0)
    social = scores.get("social", 0)
    dispute = clinic.get("dispute_count", 0)
    review_count = clinic.get("review_count", 0)
    lines = [
        f"【{name}】完整評鑑報告",
        "",
        f"📍 地址：{address}",
        f"📊 綜合評分：{total:.1f} 分" + (f"（{review_count} 則評論）" if review_count else ""),
        "",
    ]
    if scores:
        lines.extend([
            "五維度評分：",
            f"　司法糾紛：{judicial:.1f}",
            f"　Google 評分：{google:.1f}",
            f"　合法登記：{legal:.1f}",
            f"　新聞媒體：{media:.1f}",
            f"　社群討論：{social:.1f}",
            "",
        ])
    lines.extend([
        f"療程項目：{tags_str}",
        "",
        "糾紛紀錄：" + ("無" if dispute == 0 else f"有 {dispute} 件，詳情可於平台查詢。"),
    ])
    return "\n".join(lines)


def format_doctor_report(doctor: dict[str, Any]) -> str:
    """回傳醫師完整報告文字。"""
    name = doctor.get("name") or ""
    title = doctor.get("title") or ""
    specialty = doctor.get("specialty") or ""
    clinic_name = doctor.get("clinic_name") or ""
    years = doctor.get("years_of_practice", 0)
    specs = doctor.get("specs") or []
    specs_str = "、".join(specs[:8]) if specs else "—"
    dispute = doctor.get("dispute_count", 0)
    license_ok = doctor.get("license_valid", True)
    lines = [
        f"【{name}】完整報告",
        "",
        f"職稱：{title}",
        f"專科：{specialty}",
        f"現職診所：{clinic_name}",
        f"執業年資：{years} 年",
        "",
        f"專長：{specs_str}",
        "",
        "執照狀態：" + ("有效" if license_ok else "待查證"),
        "糾紛紀錄：" + ("無" if dispute == 0 else f"有 {dispute} 件，詳情可於平台查詢。"),
    ]
    return "\n".join(lines)
