# 360 醫療 AI 大調查 — LINE 後端 (Cloud Run)
FROM python:3.11-slim

WORKDIR /app

# 安裝依賴
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 應用程式
COPY . .

# Cloud Run 預設聽 8080
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
