"""
後端設定：從環境變數載入。
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# 從 backend/.env 載入（若存在）
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

# LINE
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")
LINE_CHANNEL_SECRET = os.getenv("LINE_CHANNEL_SECRET", "")

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Redis（對話狀態）
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# PostgreSQL（診所、預約）
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/360medical")
