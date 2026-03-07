"""
推薦診所：查詢合作且評分 >= 7.5 的診所，格式化給 Gemini 使用。
目前為假資料（從 data/clinics.ts 轉成 Python），之後改接 PostgreSQL。
"""
from typing import Any

# 假資料：從前端 data/clinics.ts 轉成 Python，欄位對應 DB 風格
# 先不接 PostgreSQL，等資料庫建好再改為 DB 查詢
FAKE_CLINICS: list[dict[str, Any]] = [
    {"id": "c01", "name": "晶緻醫美診所", "type": "醫美診所", "address": "台北市信義區忠孝東路五段123號", "district": "信義區", "tags": ["皮秒雷射", "玻尿酸", "肉毒桿菌"], "is_partner": True, "score_total": 9.4, "dispute_count": 0},
    {"id": "c02", "name": "璞真整形外科診所", "type": "整形外科", "address": "台北市大安區敦化南路一段88號", "district": "大安區", "tags": ["雙眼皮", "隆鼻", "拉皮", "縮鼻翼"], "is_partner": True, "score_total": 8.9, "dispute_count": 0},
    {"id": "c03", "name": "悅顏皮膚科診所", "type": "皮膚科", "address": "台北市中山區中山北路二段33號", "district": "中山區", "tags": ["皮秒", "淡斑", "痘疤", "保濕療程"], "is_partner": True, "score_total": 8.7, "dispute_count": 0},
    {"id": "c04", "name": "凰漾美學診所", "type": "醫美診所", "address": "新北市板橋區文化路一段56號", "district": "板橋區", "tags": ["電波拉皮", "超音波", "體雕"], "is_partner": True, "score_total": 9.1, "dispute_count": 0},
    {"id": "c06", "name": "光澤皮膚科診所", "type": "皮膚科", "address": "台北市內湖區瑞光路288號", "district": "內湖區", "tags": ["飛梭雷射", "淨膚", "光子嫩膚"], "is_partner": True, "score_total": 8.8, "dispute_count": 0},
    {"id": "c07", "name": "薇采醫美診所", "type": "醫美診所", "address": "台北市士林區中山北路六段55號", "district": "士林區", "tags": ["玻尿酸", "童顏針", "晶亮瓷"], "is_partner": True, "score_total": 8.9, "dispute_count": 0},
    {"id": "c10", "name": "雙星皮膚科診所", "type": "皮膚科", "address": "台北市文山區木柵路三段22號", "district": "文山區", "tags": ["痘痘治療", "敏感修護", "痘疤雷射"], "is_partner": True, "score_total": 8.6, "dispute_count": 0},
    {"id": "c11", "name": "禾澄醫美診所", "type": "醫美診所", "address": "桃園市中壢區中山路101號", "district": "中壢區", "tags": ["皮秒雷射", "電波拉皮", "玻尿酸"], "is_partner": True, "score_total": 8.8, "dispute_count": 0},
    {"id": "c12", "name": "典雅整形外科診所", "type": "整形外科", "address": "台中市西屯區台灣大道三段888號", "district": "西屯區", "tags": ["雙眼皮", "臥蠶", "眼袋"], "is_partner": True, "score_total": 9.3, "dispute_count": 0},
    {"id": "c14", "name": "絲漾醫美診所", "type": "醫美診所", "address": "台南市東區東門路一段200號", "district": "東區", "tags": ["超音波拉皮", "埋線拉提", "肉毒"], "is_partner": True, "score_total": 9.1, "dispute_count": 0},
    {"id": "c15", "name": "悠美整形診所", "type": "整形外科", "address": "高雄市苓雅區四維三路33號", "district": "苓雅區", "tags": ["抽脂", "隆乳", "眼整形"], "is_partner": True, "score_total": 8.7, "dispute_count": 0},
    {"id": "c17", "name": "凌頂醫美診所", "type": "醫美診所", "address": "新北市永和區中正路399號", "district": "永和區", "tags": ["皮秒雷射", "童顏針", "體雕減脂"], "is_partner": True, "score_total": 9.2, "dispute_count": 0},
    {"id": "c19", "name": "晨曦皮膚科診所", "type": "皮膚科", "address": "桃園市桃園區復興路200號", "district": "桃園區", "tags": ["IPL光子", "淡斑", "縮毛孔"], "is_partner": True, "score_total": 8.8, "dispute_count": 0},
]

def get_partner_clinics(
    district: str | None = None,
    treatment_type: str | None = None,
) -> list[dict[str, Any]]:
    """
    查詢合作診所：is_partner=true 且 score_total >= 7.5。
    支援篩選：district（地區關鍵字，對應 address 或 district）、treatment_type（療程關鍵字，對應 tags）。
    回傳欄位：id, name, district, score_total, tags, dispute_count。
    """
    base = [
        c for c in FAKE_CLINICS
        if c.get("is_partner") is True and (c.get("score_total") or 0) >= 7.5
    ]
    if district and district.strip():
        key = district.strip()
        base = [
            c for c in base
            if key in (c.get("address") or "") or key in (c.get("district") or "")
        ]
    if treatment_type and treatment_type.strip():
        key = treatment_type.strip()
        base = [
            c for c in base
            if any(key in (t or "") for t in (c.get("tags") or []))
        ]
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "district": c["district"],
            "score_total": c["score_total"],
            "tags": c["tags"],
            "dispute_count": c["dispute_count"],
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
    by_id = {c["id"]: c for c in FAKE_CLINICS}
    for i, c in enumerate(clinics, 1):
        name = c.get("name") or ""
        district = c.get("district") or ""
        full = by_id.get(c["id"], c)
        addr = full.get("address") or ""
        if addr and "區" in addr:
            region = addr[: addr.index("區") + 1]
        else:
            region = district
        score = c.get("score_total")
        score_str = f"評分 {score:.1f}" if isinstance(score, (int, float)) else "評分 —"
        dispute = c.get("dispute_count") or 0
        dispute_str = "有糾紛紀錄" if dispute else "無糾紛"
        tags = c.get("tags") or []
        tags_str = "/".join(tags[:6]) if tags else "—"
        lines.append(f"{i}. {name}｜{region}｜{score_str}｜{dispute_str}｜{tags_str}")
    return "\n".join(lines)
