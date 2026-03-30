"""Admin AI 顧問調校 API"""
import json
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database import get_db
from ai.gemini import build_system_prompt, cache_system_prompt

router = APIRouter(prefix="/admin/ai-tuning", tags=["admin-ai-tuning"])

DEFAULT_SETTINGS: dict = {
    "tone": "warm",
    "colloquial_level": 2,
    "rhythm_mode": "medium",
    "auto_rhythm": False,
    "reply_length": 3,
    "pause_level": 3,
    "guide_logic": {
        "trust_building": True,
        "recommend_report": True,
        "lead_booking": True,
    },
    "guide_intensity": 3,
    "daily_target": 5,
    "conversion_target": 30,
    "opening_message": (
        "嗨！我是 360 醫美 AI 顧問 😊\n\n"
        "您是否正在考慮醫美療程，或想查詢某家診所的評鑑結果呢？\n\n"
        "我可以幫您查詢診所的司法紀錄、合法登記狀態、Google 真實評論，"
        "讓您做出更有信心的選擇！請直接告訴我您想了解什麼 👇"
    ),
    "banned_words": [
        "保證效果", "絕對安全", "100%有效", "最好的診所", "第一名",
        "神奇療效", "永久有效", "完全根治", "瘦X公斤", "年輕X歲", "無副作用", "不會痛",
    ],
    "trigger_rules": [
        {"condition": "猶豫或不確定", "action": "主動詢問具體需求", "enabled": True},
        {"condition": "比較多家診所", "action": "提供客觀評鑑數據比較", "enabled": True},
        {"condition": "對某診所表達興趣", "action": "立即推送預約連結", "enabled": True},
        {"condition": "表達擔心或疑慮", "action": "先同理再提供資訊", "enabled": True},
        {"condition": "沉默超過5分鐘", "action": "主動提問重新引導", "enabled": True},
    ],
    "faq_answers": [
        {
            "question": "玻尿酸多少錢？",
            "answer": "玻尿酸的費用依注射部位、品牌和劑量不同，一般約 $8,000–$25,000。建議直接詢問您有興趣的診所，或我幫您查看該診所的療程頁面 😊",
            "enabled": True,
        },
        {
            "question": "怎麼選擇醫美診所？",
            "answer": "建議從三個面向評估：合法登記（衛福部健保署）、司法糾紛紀錄（司法院裁判書）、Google 真實評論。我可以幫您查詢任一診所的評鑑報告，直接輸入診所名稱就可以囉！",
            "enabled": True,
        },
        {
            "question": "你們是廣告嗎？",
            "answer": "我們是獨立的醫美評鑑平台，評鑑分數完全依據官方公開資料自動計算，不受商業關係影響。任何人都可以自行前往司法院、衛福部、Google Maps 驗證我們的資料 😊",
            "enabled": True,
        },
        {
            "question": "如何預約診所？",
            "answer": "找到您有興趣的診所後，點選「立即預約」按鈕，填寫療程、希望時間、姓名電話，送出後我們會安排諮詢師與您聯繫確認 😊",
            "enabled": True,
        },
    ],
}


@router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_tuning_settings (
                id SERIAL PRIMARY KEY,
                settings JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW(),
                updated_by TEXT
            )
        """))
        await db.commit()
        r = await db.execute(text(
            "SELECT settings FROM ai_tuning_settings ORDER BY id DESC LIMIT 1"
        ))
        row = r.fetchone()
        if row:
            return row[0]
    except Exception as e:
        print(f"[ai-tuning] get settings error: {e}")
    return DEFAULT_SETTINGS


@router.put("/settings")
async def put_settings(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.json()
    try:
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_tuning_settings (
                id SERIAL PRIMARY KEY,
                settings JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW(),
                updated_by TEXT
            )
        """))
        await db.execute(text("""
            INSERT INTO ai_tuning_settings (settings, updated_at)
            VALUES (:s::jsonb, NOW())
        """), {"s": json.dumps(body, ensure_ascii=False)})
        await db.commit()
    except Exception as e:
        print(f"[ai-tuning] save error: {e}")

    # Rebuild and cache Gemini system prompt
    try:
        prompt = build_system_prompt(body)
        cache_system_prompt(prompt)
    except Exception as e:
        print(f"[ai-tuning] build prompt error: {e}")

    return {"success": True}
