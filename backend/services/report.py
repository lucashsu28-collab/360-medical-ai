"""
LINE Flex Message：診所／醫師報告卡片。
供 webhook 在用戶傳「報告:clinic_xxx」或「報告:doctor_xxx」時回傳。
"""
from typing import Any

# 前端站點 base URL（用於「查看官網」「查看診所」），未設定則用 # 占位
import os
APP_BASE_URL = os.getenv("APP_BASE_URL", "").rstrip("/") or "#"
LINE_ADD_URL = "https://lin.ee/6sTCRzm"


def _score_color(value: float, is_legal: bool = False) -> str:
    """五維度分數顏色：>=9 綠、>=7 橘、否則紅；合法登記滿分用藍 #2196F3。"""
    if is_legal and value >= 10:
        return "#2196F3"
    if value >= 9:
        return "#00B900"
    if value >= 7:
        return "#ff9800"
    return "#f44336"


def _dimension_row(icon_label: str, value: float, is_legal: bool = False) -> dict[str, Any]:
    """五維度單行：左 text flex 3，右分數 flex 1 align end，分數依值上色。"""
    color = _score_color(value, is_legal)
    return {
        "type": "box",
        "layout": "horizontal",
        "contents": [
            {"type": "text", "text": icon_label, "size": "sm", "color": "#333333", "flex": 3},
            {"type": "text", "text": f"{value:.1f}", "size": "sm", "weight": "bold", "align": "end", "color": color, "flex": 1},
        ],
    }


def _treatment_tag(text: str) -> dict[str, Any]:
    """療程標籤：xs、#1565c0、#e3f2fd、cornerRadius 12px、paddingAll 6px、margin sm。"""
    return {
        "type": "box",
        "layout": "vertical",
        "contents": [{"type": "text", "text": text, "size": "xs", "color": "#1565c0"}],
        "backgroundColor": "#e3f2fd",
        "cornerRadius": "12px",
        "paddingAll": "6px",
        "margin": "sm",
    }


def build_clinic_flex_report(clinic: dict[str, Any]) -> dict[str, Any]:
    """
    回傳 LINE Flex Message 的 contents（一個 bubble）。
    規格：header #1a1a2e、小標綠字+診所名+地址；
    body 評分區+五維度（依分數上色）+療程標籤+糾紛狀態；footer 預約/官網。
    """
    name = clinic.get("name") or "診所"
    address = clinic.get("address") or ""
    tags = clinic.get("tags") or []
    scores = clinic.get("scores") or {}
    total = scores.get("total") or clinic.get("score_total") or 0
    judicial = scores.get("judicial", 0)
    google = scores.get("google", 0)
    legal = scores.get("legal", 0)
    media = scores.get("media", 0)
    social = scores.get("social", 0)
    dispute = clinic.get("dispute_count", 0)
    clinic_id = clinic.get("id") or ""

    # Header
    header_contents: list[dict[str, Any]] = [
        {"type": "text", "text": "📋 360 完整評鑑報告", "size": "xs", "color": "#00B900"},
        {"type": "text", "text": name, "size": "xl", "weight": "bold", "color": "#ffffff", "wrap": True},
        {"type": "text", "text": address, "size": "xs", "color": "#aaaaaa", "wrap": True},
    ]

    # Body 1: 評分區（horizontal）
    score_section = {
        "type": "box",
        "layout": "horizontal",
        "contents": [
            {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {"type": "text", "text": f"{total:.1f}", "size": "3xl", "weight": "bold", "color": "#00B900"},
                    {"type": "text", "text": "360 綜合評分", "size": "xs", "color": "#888888"},
                ],
            },
            {
                "type": "box",
                "layout": "vertical",
                "contents": [{"type": "text", "text": "✅ 值得信賴", "size": "xs", "color": "#00B900", "weight": "bold"}],
                "backgroundColor": "#e8f5e9",
                "cornerRadius": "20px",
                "paddingAll": "8px",
            },
        ],
    }

    # Body 3: 五維度（每行依分數上色，合法登記滿分藍）
    dimension_rows = [
        _dimension_row("司法糾紛 ⚖️", judicial),
        _dimension_row("Google評分 ⭐", google),
        _dimension_row("合法登記 ✅", legal, is_legal=True),
        _dimension_row("新聞媒體 📰", media),
        _dimension_row("社群討論 💬", social),
    ]

    # Body 5: 療程標籤（每行多個 tag，多行）
    tag_boxes: list[dict[str, Any]] = []
    if tags:
        row_size = 4
        for i in range(0, min(len(tags), 12), row_size):
            row_tags = tags[i : i + row_size]
            tag_boxes.append({
                "type": "box",
                "layout": "horizontal",
                "contents": [_treatment_tag(t) for t in row_tags],
            })

    # Body 6: 糾紛狀態 box
    if dispute == 0:
        dispute_box = {
            "type": "box",
            "layout": "vertical",
            "contents": [{"type": "text", "text": "✅ 近3年無司法糾紛", "size": "sm", "color": "#2e7d32", "weight": "bold"}],
            "backgroundColor": "#e8f5e9",
            "cornerRadius": "8px",
            "paddingAll": "8px",
        }
    else:
        dispute_box = {
            "type": "box",
            "layout": "vertical",
            "contents": [{"type": "text", "text": "⚠️ 有司法紀錄", "size": "sm", "color": "#c62828", "weight": "bold"}],
            "backgroundColor": "#ffeaea",
            "cornerRadius": "8px",
            "paddingAll": "8px",
        }

    body_contents: list[dict[str, Any]] = [
        score_section,
        {"type": "separator"},
        *dimension_rows,
        {"type": "separator"},
    ]
    if tag_boxes:
        body_contents.extend(tag_boxes)
    body_contents.append(dispute_box)

    website_uri = f"{APP_BASE_URL}/clinics/{clinic_id}" if APP_BASE_URL and APP_BASE_URL != "#" else LINE_ADD_URL

    # Footer
    footer_contents: list[dict[str, Any]] = [
        {
            "type": "button",
            "style": "primary",
            "color": "#00B900",
            "action": {"type": "uri", "label": "📅 預約諮詢", "uri": LINE_ADD_URL},
        },
        {
            "type": "button",
            "style": "secondary",
            "action": {"type": "uri", "label": "🔗 查看官網", "uri": website_uri},
            "margin": "sm",
        },
    ]

    return {
        "type": "bubble",
        "header": {
            "type": "box",
            "layout": "vertical",
            "spacing": "xs",
            "contents": header_contents,
            "backgroundColor": "#1a1a2e",
            "paddingAll": "16px",
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": body_contents,
            "paddingAll": "16px",
        },
        "footer": {
            "type": "box",
            "layout": "horizontal",
            "spacing": "sm",
            "contents": footer_contents,
            "paddingAll": "12px",
        },
    }


def _review_keyword_tag(text: str) -> dict[str, Any]:
    """患者評價關鍵字標籤：同療程樣式但 color #2e7d32、backgroundColor #e8f5e9。"""
    return {
        "type": "box",
        "layout": "vertical",
        "contents": [{"type": "text", "text": text, "size": "xs", "color": "#2e7d32"}],
        "backgroundColor": "#e8f5e9",
        "cornerRadius": "12px",
        "paddingAll": "6px",
        "margin": "sm",
    }


def build_doctor_flex_report(doctor: dict[str, Any]) -> dict[str, Any]:
    """
    回傳 LINE Flex Message 的 contents（一個 bubble）。
    漂亮版：header 深藍 #1a237e、統計區三格、擅長療程、司法紀錄、患者評價關鍵字。
    """
    name = doctor.get("name") or "醫師"
    specialty = doctor.get("specialty") or ""
    clinic_name = doctor.get("clinic_name") or ""
    clinic_id = doctor.get("clinic_id") or ""
    years = doctor.get("years_of_practice", 0)
    specs = doctor.get("specs") or []
    dispute = doctor.get("dispute_count", 0)
    clinic_score = doctor.get("clinic_score")
    review_keywords: list[str] = doctor.get("review_keywords") or ["專業", "解說清楚", "術後照護", "預約方便"]

    # Header
    header_contents: list[dict[str, Any]] = [
        {"type": "text", "text": "👨‍⚕️ 醫師完整評鑑報告", "size": "xs", "color": "#90caf9"},
        {"type": "text", "text": name, "size": "xl", "weight": "bold", "color": "#ffffff", "wrap": True},
        {"type": "text", "text": f"{specialty} · {clinic_name}", "size": "xs", "color": "#aaaaaa", "wrap": True},
    ]

    # Body 1: 統計區（horizontal，3 格）
    score_str = f"{clinic_score:.1f}" if isinstance(clinic_score, (int, float)) else "—"
    dispute_color = "#00B900" if dispute == 0 else "#f44336"
    stats_section = {
        "type": "box",
        "layout": "horizontal",
        "contents": [
            {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {"type": "text", "text": str(years), "size": "xl", "weight": "bold", "color": "#1a237e"},
                    {"type": "text", "text": "年資", "size": "xs", "color": "#888888"},
                ],
                "backgroundColor": "#f8f9fa",
                "cornerRadius": "8px",
                "paddingAll": "10px",
                "flex": 1,
            },
            {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {"type": "text", "text": score_str, "size": "xl", "weight": "bold", "color": "#00B900"},
                    {"type": "text", "text": "評價", "size": "xs", "color": "#888888"},
                ],
                "backgroundColor": "#f8f9fa",
                "cornerRadius": "8px",
                "paddingAll": "10px",
                "flex": 1,
            },
            {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {"type": "text", "text": str(dispute), "size": "xl", "weight": "bold", "color": dispute_color},
                    {"type": "text", "text": "糾紛", "size": "xs", "color": "#888888"},
                ],
                "backgroundColor": "#f8f9fa",
                "cornerRadius": "8px",
                "paddingAll": "10px",
                "flex": 1,
            },
        ],
    }

    # Body 3: 擅長療程標籤（同診所療程樣式）
    spec_tag_boxes: list[dict[str, Any]] = []
    if specs:
        row_size = 4
        for i in range(0, min(len(specs), 12), row_size):
            row_specs = specs[i : i + row_size]
            spec_tag_boxes.append({
                "type": "box",
                "layout": "horizontal",
                "contents": [_treatment_tag(s) for s in row_specs],
            })

    # Body 5: 司法紀錄 box
    if dispute == 0:
        dispute_box = {
            "type": "box",
            "layout": "vertical",
            "contents": [{"type": "text", "text": "✅ 近5年無醫療糾紛司法紀錄", "size": "sm", "color": "#2e7d32", "weight": "bold"}],
            "backgroundColor": "#e8f5e9",
            "cornerRadius": "8px",
            "paddingAll": "8px",
        }
    else:
        dispute_box = {
            "type": "box",
            "layout": "vertical",
            "contents": [{"type": "text", "text": "⚠️ 有司法紀錄，請謹慎評估", "size": "sm", "color": "#c62828", "weight": "bold"}],
            "backgroundColor": "#ffeaea",
            "cornerRadius": "8px",
            "paddingAll": "8px",
        }

    body_contents: list[dict[str, Any]] = [
        stats_section,
        {"type": "separator"},
        *spec_tag_boxes,
        {"type": "separator"},
        dispute_box,
    ]

    # Body 6: 患者評價關鍵字（若有）
    if review_keywords:
        keyword_tags = [_review_keyword_tag(k) for k in review_keywords[:8]]
        keyword_rows: list[dict[str, Any]] = []
        row_size = 4
        for i in range(0, len(keyword_tags), row_size):
            keyword_rows.append({
                "type": "box",
                "layout": "horizontal",
                "contents": keyword_tags[i : i + row_size],
            })
        body_contents.append({"type": "text", "text": "患者評價", "size": "xs", "color": "#888888"})
        body_contents.extend(keyword_rows)

    clinic_uri = f"{APP_BASE_URL}/clinics/{clinic_id}" if APP_BASE_URL and APP_BASE_URL != "#" and clinic_id else LINE_ADD_URL

    footer_contents: list[dict[str, Any]] = [
        {
            "type": "button",
            "style": "primary",
            "color": "#1a237e",
            "action": {"type": "uri", "label": "📅 預約這位醫師", "uri": LINE_ADD_URL},
        },
        {
            "type": "button",
            "style": "secondary",
            "action": {"type": "uri", "label": "🔗 查看診所", "uri": clinic_uri},
            "margin": "sm",
        },
    ]

    return {
        "type": "bubble",
        "header": {
            "type": "box",
            "layout": "vertical",
            "spacing": "xs",
            "contents": header_contents,
            "backgroundColor": "#1a237e",
            "paddingAll": "16px",
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": body_contents,
            "paddingAll": "16px",
        },
        "footer": {
            "type": "box",
            "layout": "horizontal",
            "spacing": "sm",
            "contents": footer_contents,
            "paddingAll": "12px",
        },
    }
