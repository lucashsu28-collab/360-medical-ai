# 360醫療AI大調查 — Claude 工作手冊
> 最後更新：2026-03-24 22:30
## 專案基本資訊
- 公司：真好整合行銷有限公司
- 本機路徑：C:\Users\User\Dropbox\Projects\medical-ai
- GitHub：https://github.com/lucashsu28-collab/360-medical-ai
- 前端：https://360-medical-ai.vercel.app
- 後端：https://medical-backend-492121133498.asia-east1.run.app
- 技術棧：Next.js 14 + FastAPI + PostgreSQL + Redis
## 雲端環境（已上線）
- 前端：Vercel
- 後端：GCP Cloud Run（asia-east1）
- 資料庫：GCP Cloud SQL 34.81.74.228（DB：medical_ai）
- GCP 專案ID：medical-ai-489522
- Deploy指令：gcloud run deploy medical-backend --source backend --region asia-east1 --allow-unauthenticated --project medical-ai-489522
## LINE 設定
- 官方帳號：360醫美AI智能顧問
- Channel ID：2009297793
- LIFF ID：2009360724-7DzjBKHU
- Webhook：https://medical-backend-492121133498.asia-east1.run.app/webhook/line
## 資料規模
- 診所：904筆真實資料
- NHI記錄：24,321筆
- Google Places：904筆評分
## 與AIMS的關係
- 本平台是獲客漏斗，診所透過本平台購買AIMS方案
- 兩系統透過API串接（待開發）
- 串接點：診所點「升級行銷方案」→ 呼叫AIMS API → 自動建立客戶帳號
## 協作規則
- 溝通語言：繁體中文
- Lucas（帥帥老大）= 產品決策
- Claude = 架構規劃 + 給指令
- 給 Code 的指令：全部放在單一框內，一鍵複製
- 給 Lucas 的 PowerShell：全部放在單一框內，一鍵複製
- 兩種框不可混在一起
- 直接給指令，不用解釋太多
- PowerShell 指令一次給完，不分段
- 完成後 git commit + push
## 詳細進度請讀取
docs/HANDOVER.md
