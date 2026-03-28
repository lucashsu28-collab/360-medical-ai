# 360醫療AI大調查 — 開發交接文件
> 最後更新：2026-03-29

---

## 一、專案基本資訊
| 項目 | 內容 |
|------|------|
| 本機路徑 | C:\Users\User\Dropbox\Projects\medical-ai |
| 前端 | https://360-medical-ai.vercel.app |
| 後端 | https://medical-backend-492121133498.asia-east1.run.app |
| GitHub | https://github.com/lucashsu28-collab/360-medical-ai |
| GCP 專案 | medical-ai-489522 |
| 資料庫 | Cloud SQL 34.81.74.228（DB：medical_ai）|

---

## 二、部署指令
```
gcloud run deploy medical-backend --source backend --region asia-east1 --allow-unauthenticated --project medical-ai-489522
```

---

## 三、LINE 設定
- 官方帳號：360醫美AI智能顧問
- Channel ID：2009297793
- LIFF ID：2009360724-7DzjBKHU
- Webhook：https://medical-backend-492121133498.asia-east1.run.app/webhook/line

---

## 四、資料規模
| 資料 | 筆數 |
|------|------|
| 診所（clinics） | 1,567+ 筆（含醫美+外科關鍵字） |
| clinics_real.json | 904 筆原始診所 |
| nhi_all.json | 24,321 筆 NHI |
| places_results.json | 904 筆 Google 評分 |
| judicial_results.json | 904 筆（496 家有案件）|
| clinic_reviews | 13,600+ 則 Google 真實評論 |

---

## 五、評鑑體系

### 診所六維度（滿分 100）
| 維度 | 分值 | 狀態 |
|------|------|------|
| 司法糾紛 | 20 分 | ✅ 完成 |
| 合法登記 | 20 分 | ✅ 完成 |
| Google 評分 | 20 分 | ✅ 完成 |
| Google 評論數 | 5 分 | ✅ 完成 |
| 行政處分 | 20 分 | ⏳ 待開發（資料來源待確認）|
| 新聞媒體 | 20 分 | ⏳ 待 AIMS 串接 |
| 社群討論 | — | ⏳ 待 AIMS 串接 |

### 醫師五維度
1. 執照合法性 ✅
2. 司法糾紛 ✅
3. 行政處分 ⏳ 待開發
4. 新聞媒體 ⏳ 待 AIMS 串接
5. 社群口碑 ⏳ 待 AIMS 串接

---

## 六、✅ 已完成

### 前台（35 個頁面）
- 首頁、診所列表（1,567 筆 + 臺台篩選）、診所詳細頁
- 醫師列表 + 詳細頁
- 療程列表 + 詳細頁
- 診所對比工具
- 各縣市導航頁
- 部落格 + Wiki 百科 + FAQ
- 合作診所頁、診所資料更新入口、我想合作頁
- 推廣活動頁、關於我們、LIFF 頁

### 後台（13 模組，9 個接真實 DB）
- ✅ 登入、儀表板統計
- ✅ 診所管理（搜尋/編輯/評分）
- ✅ 合作診所管理
- ✅ 解鎖記錄查詢
- ✅ 推播記錄查詢
- ✅ 告警系統
- ✅ 爬蟲排程管理（手動觸發）
- ✅ 資料匯出（CSV + PDF）
- ✅ 評分規則動態管理
- ⏳ LINE AI 訓練（UI 完成，待後端串接）
- ⏳ AI 訓練資料（UI 完成，待後端串接）
- ⏳ GA4 流量分析（UI 完成，待串接）
- ⏳ CMS 內容管理（UI 完成，待後端串接）

### 後端 & 爬蟲
- FastAPI + PostgreSQL + SQLAlchemy（10 個 Model）
- 爬蟲：Google Places、司法院、衛福部、NHI、醫師查詢、評分計算（共 11 個）
- GCP Cloud Scheduler 三個排程（Google 每 10 天 / 司法+衛福 每 30 天）
- Google Places 真實評論入庫（13,600+ 則）
- Alembic 資料庫遷移（5 個版本）

### LINE 整合
- LINE Webhook + LIFF（auto_unlock）
- Flex 報告卡片（診所六維度 + 醫師）
- Gemini 2.5 Flash AI 顧問
- 對話記錄儲存 DB

### SEO
- Schema.org MedicalOrganization 結構化標記
- Sitemap 自動生成（診所+城市+FAQ+專欄+百科）
- generateMetadata 動態 SEO（每家診所獨立 title/description/OG）

---

## 七、⏳ 待完成

### Phase 2（待定義）
> Lucas 整理中，稍後補入。

### Phase 3（AIMS 串接與分析）
| 功能 | 備註 |
|------|------|
| AIMS AI SEO 文章推送 | 依賴 AIMS 系統 |
| AIMS 口碑監測串接 | 新聞 + 社群兩個維度 |
| GA4 流量分析後台 | 後台 analytics 模組 |
| CMS Banner/公告管理 | 後台 cms 模組 |
| LINE 推播排程 | 目前僅手動 |
| 爬蟲自動排程驗證 | Cloud Scheduler 驗證 |

### Phase 4（上線後再做）
| 功能 | 備註 |
|------|------|
| 行政處分爬蟲 | 衛福部資料來源待確認 |
| 診所↔醫師對應 | 診所後台自填 |
| 正式網域購買 + 綁定 Vercel | — |
| 診所預約系統 | 診所頁集成 + 抽傭 |
| 多醫療產業擴充 | 牙科、眼科、生殖中心 |
| 付費解鎖/訂閱制 | 商業化 |
| Email/LINE 告警推播 | 目前僅後台顯示 |

---

## 八、與 AIMS 串接（待開發）
- 診所點「升級行銷方案」→ 呼叫 AIMS API → 自動建立客戶帳號
- AIMS GitHub：https://github.com/lucashsu28-collab/ai-seo-geo-engine

---

## 九、協作規則
- Lucas（帥帥老大）= 產品決策
- Claude = 架構規劃 + 給指令
- 給 Code 的指令：全部放在單一框內，一鍵複製
- 給 Lucas 的 PowerShell：全部放在單一框內，一鍵複製
- 兩種框不可混在一起
- 繁體中文溝通
- 完成後 git commit + push
