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


def _dimension_row(icon_label: str, value: float, max_val: float = 10, is_legal: bool = False) -> dict[str, Any]:
    """五維度單行：標籤+分數，下方進度條。"""
    color = _score_color(value, is_legal)
    pct = int((value / max_val) * 100) if max_val else 0
    return {
        "type": "box",
        "layout": "vertical",
        "contents": [
            {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                    {"type": "text", "text": icon_label, "size": "sm", "color": "#333333", "flex": 3},
                    {"type": "text", "text": f"{value:.1f}", "size": "sm", "weight": "bold", "align": "end", "color": color, "flex": 1},
                ],
            },
            {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [{"type": "filler"}],
                        "width": f"{pct}%",
                        "backgroundColor": color,
                        "height": "4px",
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [{"type": "filler"}],
                        "width": f"{100 - pct}%",
                        "backgroundColor": "#eeeeee",
                        "height": "4px",
                    },
                ],
                "margin": "xs",
            },
        ],
        "margin": "sm",
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
    score_breakdown = clinic.get("score_breakdown") or {}
    total = clinic.get("score") or 0
    judicial = score_breakdown.get("judicial", 0)
    google = score_breakdown.get("google", 0)
    legal = clinic.get("legal_score") or score_breakdown.get("legal", 0)
    media = score_breakdown.get("media", 0)
    social = score_breakdown.get("social", 0)
    dispute = clinic.get("dispute_count", 0)
    tags = clinic.get("treatments") or clinic.get("tags") or []
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
    legal_note = {
        "type": "text",
        "text": "※ 資料來源：健保署，如有落差請以實際為準",
        "size": "xxs",
        "color": "#aaaaaa",
        "wrap": True,
        "margin": "xs",
    }
    dimension_rows = [
        _dimension_row("司法糾紛 ⚖️", judicial, max_val=10),
        _dimension_row("Google評分 ⭐", google, max_val=10),
        _dimension_row("合法登記 ✅", legal, max_val=10, is_legal=True),
        legal_note,
        _dimension_row("新聞媒體 📰", media, max_val=10),
        _dimension_row("社群討論 💬", social, max_val=10),
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
    """衛福部醫師執照查驗報告（欄位：人員姓名、性別、執業縣市、主要執業科別等）。"""
    name = doctor.get("人員姓名") or doctor.get("name") or "醫師"
    gender = doctor.get("性別", "")
    area = doctor.get("執業縣市", "")
    specialty = doctor.get("主要執業科別", "")
    reg_type = doctor.get("主要執登類別", "")
    cert = doctor.get("證書類別", "")
    expert = doctor.get("專科資格", "無")
    doc_seq = doctor.get("doc_seq", "")

    return {
        "type": "bubble",
        "header": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {"type": "text", "text": "👨‍⚕️ 醫師執照查驗報告", "size": "xs", "color": "#00B900"},
                {"type": "text", "text": name, "size": "xl", "weight": "bold", "color": "#ffffff", "wrap": True},
                {"type": "text", "text": f"{area}・{specialty}", "size": "xs", "color": "#aaaaaa"},
            ],
            "backgroundColor": "#1a237e",
            "paddingAll": "16px",
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {"type": "box", "layout": "horizontal", "contents": [
                    {"type": "text", "text": "性別", "size": "sm", "color": "#888888", "flex": 2},
                    {"type": "text", "text": gender, "size": "sm", "flex": 3},
                ]},
                {"type": "box", "layout": "horizontal", "contents": [
                    {"type": "text", "text": "執業縣市", "size": "sm", "color": "#888888", "flex": 2},
                    {"type": "text", "text": area, "size": "sm", "flex": 3},
                ], "margin": "sm"},
                {"type": "box", "layout": "horizontal", "contents": [
                    {"type": "text", "text": "主要科別", "size": "sm", "color": "#888888", "flex": 2},
                    {"type": "text", "text": specialty, "size": "sm", "flex": 3},
                ], "margin": "sm"},
                {"type": "box", "layout": "horizontal", "contents": [
                    {"type": "text", "text": "執登類別", "size": "sm", "color": "#888888", "flex": 2},
                    {"type": "text", "text": reg_type, "size": "sm", "flex": 3},
                ], "margin": "sm"},
                {"type": "box", "layout": "horizontal", "contents": [
                    {"type": "text", "text": "證書類別", "size": "sm", "color": "#888888", "flex": 2},
                    {"type": "text", "text": cert, "size": "sm", "flex": 3},
                ], "margin": "sm"},
                {"type": "box", "layout": "horizontal", "contents": [
                    {"type": "text", "text": "專科資格", "size": "sm", "color": "#888888", "flex": 2},
                    {"type": "text", "text": expert, "size": "sm", "color": "#00B900" if expert != "無" else "#888888", "flex": 3},
                ], "margin": "sm"},
                {"type": "separator", "margin": "lg"},
                {"type": "text", "text": "✅ 衛福部醫事人員查驗通過", "size": "xs", "color": "#00B900", "margin": "md"},
            ],
            "paddingAll": "16px",
        },
    }
