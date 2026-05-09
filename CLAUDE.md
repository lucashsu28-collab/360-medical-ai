# 360醫療AI大調查 — Claude 工作手冊
> 最後更新：2026-05-10

## 🔴 最高原則（凌駕一切）
**你能做的不可以叫 Lucas 做。除非你真的無法解決。**

- Claude 有 Edit/Write/Bash/Glob/Grep 全套工具，能做的事一律自己做
- git add/commit/push/merge、alembic upgrade、gcloud deploy、curl 測試全部自己跑
- 絕對不可以把任務寫成「給 Code 的指令（一鍵複製）」框丟給 Lucas，他不是 copy-paste 機器人
- 只有以下才求助 Lucas：
  - 需要進 GCP/Vercel/LINE Console 點 UI 按鈕
  - 需要 OAuth/API key 重發、IAM 權限、付費決定
  - 需要他手機測 LINE 體驗
  - 業務拍板（取捨、優先順序、UI/UX 偏好）
  - 嘗試三次仍失敗，確認是環境問題

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
- Lucas（帥帥老大）= 產品決策、業務拍板
- Claude = 架構規劃 + 動手執行（程式、git、部署一條龍）
- 直接給結果，不用解釋太多
- 完成後 git commit + push 到 main（自己做）
- 如真的需要 Lucas 動手（見最高原則例外清單），才用 PowerShell 框，否則不使用
## 詳細進度請讀取
docs/HANDOVER.md
