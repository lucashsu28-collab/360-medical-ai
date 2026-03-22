<!-- 新聊天室開場指令：開始作業 -->
<!-- "開始作業" = 讀 docs/PROGRESS.md 後開始作業 -->

# 360醫療AI大調查 — 專案進度

**最後更新：2026-03-22**

---

## Phase 1 待完成項目

| # | 項目 | 狀態 |
|---|---|---|
| P1-1 | 衛福部行政處分爬蟲（診所第4維度） | ❌未開始 |
| P1-2 | 診所↔醫師對應 | ❌未開始 |
| P1-3 | 正式網域購買+綁定 | ❌未開始 |

---

## Admin 13模組

| # | 模組名稱 | 路由 | 第一階段 | 第二階段 | 第三階段 |
|---|---|---|---|---|---|
| #1 | LINE OA AI醫美顧問系統 | `/admin/line-ai` | ✅完成 | ⚠️部分完成 | ❌未開始 |
| #2 | 資料爬取系統管理 | `/admin/scheduler` | ✅完成 | ⚠️部分完成 | ❌未開始 |
| #3 | 醫美平台數據看板 | `/admin` | ✅完成 | ⚠️部分完成 | ❌未開始 |
| #4 | 客戶列表（AIMS串接） | `/admin/clients` | ❌未開始 | ❌未開始 | 🟣AIMS串接 |
| #5 | 診所資料管理 | `/admin/clinics` | ✅完成 | ⚠️部分完成 | ❌未開始 |
| #6 | 合作診所開通/停用 | `/admin/clinics/partners` | ✅完成 | ❌未開始 | ❌未開始 |
| #7 | 資料匯出 | `/admin/export` | ✅完成 | ❌未開始 | ❌未開始 |
| #8 | 網站數據分析與排名 | `/admin/analytics` | ✅完成 | ❌未開始 | ⚠️部分完成 |
| #9 | 報告解鎖管理 | `/admin/unlocks` | ✅完成 | ✅完成 | ❌未開始 |
| #10 | 內容管理 CMS | `/admin/cms` | ✅完成 | ❌未開始 | ❌未開始 |
| #11 | AI顧問訓練/調教 | `/admin/ai-training` | ✅完成 | ❌未開始 | 🟣AIMS串接 |
| #12 | 評分規則管理 | `/admin/scoring` | ✅完成 | ❌未開始 | ❌未開始 |
| #13 | 告警系統 | `/admin/alerts` | ✅完成 | ❌未開始 | ❌未開始 |

---

## Phase 2 基礎建設

| # | 項目 | 狀態 |
|---|---|---|
| B1 | PostgreSQL 接真實 DB | ⚠️部分完成 |
| B2 | GCP Cloud Scheduler 排程 | ⚠️部分完成 |
| B3 | AIMS AI SEO 文章推送 | 🟣AIMS串接 |
| B4 | AIMS 口碑監測串接 | 🟣AIMS串接 |
| B5 | Admin後台接真實DB | ⚠️部分完成 |
| B6 | Google Places 真實評論抓取 | ❌未開始 |

---

## Phase 3 商業變現

| # | 項目 | 狀態 |
|---|---|---|
| P3-1 | 預約系統 | ❌未開始 |
| P3-2 | 多醫療產業擴充 | ❌未開始 |
| P3-3 | 付費解鎖/訂閱制 | ❌未開始 |

---

## 專案資訊

| 項目 | 內容 |
|---|---|
| 專案路徑 | `c:\Users\User\Dropbox\360醫美大系統\360-medical-ai` |
| 前端 URL | https://360-medical-ai.vercel.app |
| GCP Cloud Run | https://medical-backend-492121133498.asia-east1.run.app |
| Cloud SQL IP | 34.81.74.228 |
| DB 名稱 | medical_ai |
| DB 使用者 | postgres |
| Git 最新 commit | 執行 `git log -1 --oneline` 確認 |
