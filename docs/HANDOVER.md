# 360醫療AI大調查 — 交接文件

## 專案資訊
- 前端：https://360-medical-ai.vercel.app
- GitHub：https://github.com/lucashsu28-collab/360-medical-ai
- 本機：c:\Users\User\Dropbox\360醫美大系統\360-medical-ai
- 後端API：https://medical-backend-492121133498.asia-east1.run.app
- GCP專案：medical-ai-489522，Cloud Run服務：medical-backend，region：asia-east1

## LINE設定
- 官方帳號：360醫美AI智能顧問
- 加入連結：https://lin.ee/6sTCRzm
- Channel ID：2009297793
- LIFF ID：2009360724-7DzjBKHU
- Webhook：https://medical-backend-492121133498.asia-east1.run.app/webhook/line

## 部署指令

```powershell
# 後端部署
cd "c:\Users\User\Dropbox\360醫美大系統\360-medical-ai"
gcloud run deploy medical-backend --source backend --region asia-east1 --allow-unauthenticated --project medical-ai-489522

# Git 提交
git add .
git commit -m "說明"
git push

# 執行爬蟲
cd "c:\Users\User\Dropbox\360醫美大系統\360-medical-ai\backend"
python -m crawlers.places_runner       # Google 評分
python -m crawlers.judicial_runner     # 司法裁判書
python -m crawlers.merge_judicial      # 整合司法分數進 clinics_real.json
```

---

## 醫美平台開發進度（2026/03/22更新）

### ✅ 已完成
- 前端展示版上線（Vercel）：https://360-medical-ai.vercel.app
- Gemini 2.5 Flash LINE AI顧問（push message）
- LIFF串接（含page參數+auto_unlock自動送報告）
- 診所Flex報告卡片（六維度，含各維度來源連結）
- 醫師Flex報告卡片（四維度）
- 霧化報告（加LINE解鎖）
- 健保署904家真實診所資料（clinics_real.json）
- Google Places評分（904家完整，places_results.json）
- 衛福部醫師即時查詢（httpx+BeautifulSoup）
- 醫師頁解鎖→confirm→跳LIFF→auto_unlock自動送報告到LINE
- 司法院裁判書資料（904家，496家有真實案件，judicial_results.json）
- 三維度真實資料整合進診所詳細頁（司法糾紛/Google評分/合法登記）
- 診所詳細頁 generateMetadata（動態SEO title/description/OG）
- Schema.org JSON-LD結構化標記（MedicalOrganization + AggregateRating）
- 動態Sitemap（app/sitemap.ts，含904家診所URL，每日更新）

### ⏳ 待完成（優先順序）
- 🔴 衛福部行政處分爬蟲（診所第6維度+醫師第3維度，附案件連結）
- 🟡 新聞爬蟲（NLP情緒分析）
- 🟡 PTT/Dcard社群爬蟲
- 🟡 診所↔醫師對應
- 🟡 Google Search Console提交Sitemap
- 🟢 Admin後台13模組（Phase 2，整合進AI行銷系統）
- 🟢 PostgreSQL接真實DB（Phase 2）
- 🟢 GCP Cloud Scheduler自動排程（Phase 2）
- 🟢 預約系統（Phase 3）

### Admin後台13模組規劃
1. LINE OA AI醫美顧問系統
2. 資料爬取系統管理（爬蟲排程控制）
3. 醫美平台數據看板
4. 客戶列表（AI行銷系統串接，industry=medical_aesthetic）
5. 診所資料管理（與AI行銷系統品牌資料連動同步）
6. 合作診所開通/停用（連動AI行銷系統方案狀態）
7. 資料匯出（CSV/PDF）
8. 網站數據分析與排名【重要數據資產】
9. 報告解鎖管理
10. 內容管理（CMS）
11. AI顧問訓練/調教
12. 評分規則管理（各維度權重，免改程式碼）
13. 告警系統

### 評鑑體系
診所六維度：司法糾紛/Google評分/合法登記/行政處分罰款🚨/新聞媒體/社群討論
醫師五維度：執照合法性/司法糾紛/行政處分罰款🚨/新聞媒體/社群口碑
解鎖報告：每個維度附原始資料來源URL連結

---

## 技術架構

- **Frontend**：Next.js 15 + Tailwind CSS，部署在 Vercel
- **Backend**：Python + FastAPI，部署在 Google Cloud Run
- **AI**：Gemini 2.5 Flash（診所推薦 + LINE 對話）
- **資料儲存**：JSON 檔案（`backend/data/`），Phase 2 改 PostgreSQL
- **爬蟲**：`backend/crawlers/`
- **LINE Bot**：Webhook 接收訊息，回傳 Flex Message

## 資料檔案

| 檔案 | 說明 |
|------|------|
| `backend/data/clinics_real.json` | 904 家診所（含評分、司法分數、Google評分） |
| `backend/data/places_results.json` | Google Places 評分原始資料（904 家） |
| `backend/data/judicial_results.json` | 司法裁判書數量（904 家，496 家有案件） |

## 協作默契
- C = Cursor（AI程式碼編輯器）
- Claude給「貼給C」框框指令 → Lucas直接複製貼給C執行
- 終端機用PowerShell，Claude標註「PowerShell 執行：」
- 錯誤訊息直接貼給Claude，Claude直接給解法
- 繁體中文溝通
- 新對話開始說「繼續360醫療AI大調查專案」

## 簡稱對照
- 醫美平台 = 360醫療AI大調查網站
- AIMS = 360 AI行銷系統
- C = Cursor

## 架構說明
- 醫美平台視為AIMS的一個客戶
- AIMS AI SEO系統產生文章/關鍵字 → 推送到醫美平台診所頁面
- AIMS AI口碑監測系統負責新聞/PTT/Dcard爬蟲 → 串接到醫美平台新聞媒體/社群討論維度
- 合作診所由AIMS管理客戶後台上傳療程/優惠內容 → 醫美平台前台自動同步

## 評鑑體系

### 診所六維度
1. 司法糾紛 ⚖️ — 司法院裁判書，已完成，每月更新
2. Google評分 ⭐ — Google Places API，已完成，每10天更新
3. 合法登記 🏛️ — 健保署24,321筆，已完成，每月更新
4. 行政處分/罰款 🚨 — 衛福部，待開發（Phase 1）
5. 新聞媒體 📰 — 等AIMS口碑監測系統串接
6. 社群討論 💬 — 等AIMS口碑監測系統串接

### 醫師五維度
1. 執照合法性 ✅ — 衛福部即時查詢，已完成
2. 司法糾紛 ⚖️ — 司法院裁判書，已完成
3. 行政處分/罰款 🚨 — 衛福部，待開發（Phase 1）
4. 新聞媒體 📰 — 等AIMS口碑監測系統串接
5. 社群口碑 💬 — 等AIMS口碑監測系統串接

### 解鎖報告
- 每個維度附原始資料來源連結（帶診所名稱直接查詢）
- 司法糾紛 → 司法院裁判書查詢（帶診所名）
- Google評分 → Google評論頁（place_id直連）
- 合法登記 → 衛福部醫事機構查詢

## 資料檔案
| 檔案 | 筆數 | 更新方式 |
|------|------|---------|
| backend/data/clinics_real.json | 904筆 | 爬蟲更新（含六維度評分） |
| backend/data/nhi_all.json | 24,321筆 | 每月 |
| backend/data/places_results.json | 904筆 | 每10天 |
| backend/data/judicial_results.json | 904筆（496家有案件）| 每月 |

## 已完成進度
- ✅ 前端展示版上線（Vercel）
- ✅ Gemini 2.5 Flash LINE AI顧問（push message）
- ✅ LIFF串接（含page參數+auto_unlock自動送報告）
- ✅ 診所Flex報告卡片（六維度+進度條+來源連結）
- ✅ 醫師Flex報告卡片（四維度）
- ✅ 霧化報告（加LINE解鎖）
- ✅ 健保署904家真實診所資料
- ✅ Google Places評分（904家完整）
- ✅ 衛福部醫師即時查詢
- ✅ 醫師頁解鎖→confirm→跳LIFF→auto_unlock自動送報告到LINE
- ✅ 司法院裁判書資料（904家，496家有真實案件）
- ✅ 三維度整合進診所詳細頁
- ✅ 解鎖報告各維度來源連結（帶診所名稱直接查詢）
- ✅ Schema.org MedicalOrganization結構化標記
- ✅ Sitemap自動生成（904家診所）
- ✅ generateMetadata動態SEO（每家診所獨立title/description/OG）
- ✅ 商業模式運營企畫書v2
- ✅ 系統開發架構規格書v2（含Admin後台13模組）

## 待完成（Phase 1）
- 🔴 衛福部行政處分爬蟲（診所第4維度+醫師第3維度，附案件連結）
- 🟡 診所↔醫師對應
- 🟡 正式網域購買+綁定Vercel+提交Google Search Console
- 🟣 等AIMS口碑監測系統完成後串接新聞/社群兩個維度

## 待完成（Phase 2）
- 🟢 Admin後台13模組（整合進AIMS後台）
- 🟢 PostgreSQL接真實DB（取代JSON檔案）
- 🟢 GCP Cloud Scheduler自動排程
- 🟢 AIMS AI SEO文章推送到診所頁面
- 🟢 合作診所後台管理（由AIMS管理客戶後台操作）

## 待完成（Phase 3）
- 🔵 預約系統（診所後台+消費者端+抽傭）
- 🔵 多醫療產業擴充（牙醫/眼科/生殖中心）

## Admin後台13模組規劃（Phase 2，整合進AIMS）
1. LINE OA AI醫美顧問系統（AI顧問設定、對話記錄、知識庫）
2. 資料爬取系統管理（爬蟲排程控制、手動觸發、執行記錄）
3. 醫美平台數據看板（流量/解鎖次數/診所查詢排行）
4. 客戶列表（從AIMS帶入，industry=medical_aesthetic）
5. 診所資料管理（審核/編輯，與AIMS品牌資料連動同步）
6. 合作診所開通/停用（連動AIMS方案狀態）
7. 資料匯出（診所/醫師CSV、單一診所PDF）
8. 網站數據分析與排名【重要數據資產】（GA整合、查詢排行、轉換漏斗）
9. 報告解鎖管理（解鎖記錄、付費狀態）
10. 內容管理CMS（Banner/療程/優惠文案、LINE推播）
11. AI顧問訓練/調教（對話記錄、標記好壞回答）
12. 評分規則管理（各維度權重調整，免改程式碼）
13. 告警系統（爬蟲失敗/資料異常/Cloud Run異常通知）

## 注意事項
- data/目錄在.gitignore中，需用 git add -f 強制加入
- 後端部署需在專案根目錄執行（不是在backend/目錄）
- 司法院系統每日6-12點維護，爬蟲避開此時段
- Google Places API費用：每次查詢約TWD 0.5元，904家約TWD 450元
- VISA金融卡已綁定GCP帳戶（卡號末4碼2903）
