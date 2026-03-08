"""
LINE Flex Message：診所／醫師報告卡片。
供 webhook 在用戶傳「報告:clinic_xxx」或「報告:doctor_xxx」時回傳。
"""
from typing import Any

# 前端站點 base URL（用於「查看官網」「查看診所」），未設定則用 # 占位
import os
APP_BASE_URL = os.getenv("APP_BASE_URL", "").rstrip("/") or "#"
LINE_ADD_URL = "https://lin.ee/6sTCRzm"


def _dimension_row(icon_label: str, value: float) -> dict[str, Any]:
    """五維度單行：左側 icon+名稱，右側分數。"""
    return {
        "type": "box",
        "layout": "horizontal",
        "contents": [
            {"type": "text", "text": icon_label, "size": "sm", "color": "#333333", "flex": 1},
            {"type": "text", "text": f"{value:.1f}", "size": "sm", "weight": "bold", "align": "end", "color": "#1a1a2e"},
        ],
    }


def _tag_pill(text: str) -> dict[str, Any]:
    """療程小圓角標籤。LINE Flex 僅支援 paddingAll / margin（無 paddingStart/End、marginStart/End）。"""
    return {
        "type": "box",
        "layout": "vertical",
        "contents": [{"type": "text", "text": text, "size": "xs", "color": "#555555", "wrap": True}],
        "backgroundColor": "#f0f0f0",
        "cornerRadius": "20px",
        "paddingAll": "8px",
    }


def build_clinic_flex_report(clinic: dict[str, Any]) -> dict[str, Any]:
    """
    回傳 LINE Flex Message 的 contents（一個 bubble）。
    規格：header 深色 #1a1a2e、小標+診所名+地址；
    body 綜合評分大字綠色+值得信賴、五維度、療程標籤、糾紛紀錄；
    footer 預約諮詢（綠）、查看官網（白）。
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

    # Header：深色 #1a1a2e，小標籤 + 診所名稱 + 地址
    header_contents: list[dict[str, Any]] = [
        {"type": "text", "text": "📋 360 完整評鑑報告", "size": "xs", "color": "#ffffff"},
        {"type": "text", "text": name, "size": "xl", "weight": "bold", "color": "#ffffff", "wrap": True},
        {"type": "text", "text": address, "size": "xs", "color": "#b0b0b0", "wrap": True},
    ]

    # Body：綜合評分區（大字綠色 + 右側「值得信賴」badge）
    score_section = {
        "type": "box",
        "layout": "horizontal",
        "contents": [
            {"type": "text", "text": f"{total:.1f}", "size": "xxl", "weight": "bold", "color": "#00B900"},
            {
                "type": "box",
                "layout": "vertical",
                "contents": [{"type": "text", "text": "值得信賴", "size": "xs", "color": "#00B900", "weight": "bold"}],
                "backgroundColor": "#e8f5e9",
                "cornerRadius": "8px",
                "paddingAll": "8px",
            },
        ],
    }

    # 五維度各一行
    dimensions = [
        ("⚖️ 司法糾紛　　", judicial),
        ("⭐ Google評分　", google),
        ("✅ 合法登記　　", legal),
        ("📰 新聞媒體　　", media),
        ("💬 社群討論　　", social),
    ]
    dimension_rows = [_dimension_row(label, val) for label, val in dimensions]

    # 療程標籤：小圓角，多個橫向排列（用 horizontal box 包多個 pill，可多行用多個 horizontal）
    tag_boxes: list[dict[str, Any]] = []
    if tags:
        row_size = 4
        for i in range(0, min(len(tags), 12), row_size):
            row_tags = tags[i : i + row_size]
            tag_boxes.append({
                "type": "box",
                "layout": "horizontal",
                "contents": [_tag_pill(t) for t in row_tags],
            })

    body_contents: list[dict[str, Any]] = [
        score_section,
        {"type": "separator"},
        *dimension_rows,
        {"type": "separator"},
    ]
    if tag_boxes:
        body_contents.append({"type": "text", "text": "療程", "size": "xs", "color": "#888888"})
        for box in tag_boxes:
            body_contents.append(box)
    # 糾紛紀錄
    if dispute == 0:
        body_contents.append({
            "type": "text",
            "text": "✅ 近3年無司法糾紛",
            "size": "sm",
            "color": "#00B900",
            "weight": "bold",
        })
    else:
        body_contents.append({
            "type": "text",
            "text": f"⚠️ 糾紛紀錄 {dispute} 件，詳情可於平台查詢",
            "size": "sm",
            "color": "#666666",
        })

    website_uri = f"{APP_BASE_URL}/clinics/{clinic_id}" if APP_BASE_URL and APP_BASE_URL != "#" else LINE_ADD_URL

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


def build_doctor_flex_report(doctor: dict[str, Any]) -> dict[str, Any]:
    """
    回傳 LINE Flex Message 的 contents（一個 bubble）。
    包含：醫師姓名、專科、執業年資、擅長療程、司法紀錄、患者評價關鍵字。
    底部按鈕：預約這位醫師、查看診所。
    """
    name = doctor.get("name") or "醫師"
    title = doctor.get("title") or ""
    specialty = doctor.get("specialty") or ""
    clinic_name = doctor.get("clinic_name") or ""
    clinic_id = doctor.get("clinic_id") or ""
    years = doctor.get("years_of_practice", 0)
    specs = doctor.get("specs") or []
    specs_str = "、".join(specs[:8]) if specs else "—"
    dispute = doctor.get("dispute_count", 0)
    license_ok = doctor.get("license_valid", True)
    # 患者評價關鍵字（假資料，可之後接真實資料）
    review_keywords = "專業、解說清楚、術後照護、預約方便"

    body_contents: list[dict[str, Any]] = [
        {"type": "text", "text": name, "size": "xl", "weight": "bold", "wrap": True},
        {"type": "text", "text": title, "size": "sm", "color": "#0046B8", "wrap": True},
        {"type": "text", "text": f"專科：{specialty}　執業 {years} 年", "size": "sm", "color": "#666666", "wrap": True},
        {"type": "separator"},
        {"type": "text", "text": f"現職：{clinic_name}", "size": "sm", "wrap": True},
        {"type": "text", "text": f"擅長療程：{specs_str}", "size": "sm", "wrap": True},
        {"type": "separator"},
        {"type": "text", "text": "執照狀態：" + ("有效" if license_ok else "待查證"), "size": "sm"},
        {"type": "text", "text": "司法／申訴紀錄：" + ("無" if dispute == 0 else f"有 {dispute} 件"), "size": "sm"},
        {"type": "text", "text": f"患者評價關鍵字：{review_keywords}", "size": "xs", "color": "#666666", "wrap": True},
    ]

    clinic_uri = f"{APP_BASE_URL}/clinics/{clinic_id}" if APP_BASE_URL and APP_BASE_URL != "#" and clinic_id else LINE_ADD_URL

    footer_contents: list[dict[str, Any]] = [
        {
            "type": "button",
            "style": "primary",
            "action": {"type": "uri", "label": "預約這位醫師", "uri": LINE_ADD_URL},
        },
        {
            "type": "button",
            "style": "secondary",
            "action": {"type": "uri", "label": "查看診所", "uri": clinic_uri},
        },
    ]

    return {
        "type": "bubble",
        "header": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {"type": "text", "text": "👨‍⚕️ 醫師完整報告", "size": "md", "weight": "bold", "color": "#ffffff"},
            ],
            "backgroundColor": "#0046B8",
            "paddingAll": "12px",
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
