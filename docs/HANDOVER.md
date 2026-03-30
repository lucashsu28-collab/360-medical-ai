# 360醫療AI大調查 — 開發交接文件
最後更新：2026-03-30

## 一、專案基本資訊

| 項目 | 內容 |
|------|------|
| 本機路徑 | C:\Users\User\Dropbox\Projects\medical-ai |
| 前端 | https://360-medical-ai.vercel.app |
| 後端 | https://medical-backend-492121133498.asia-east1.run.app |
| GitHub | https://github.com/lucashsu28-collab/360-medical-ai |
| GCP 專案 | medical-ai-489522 |
| 資料庫 | Cloud SQL 34.81.74.228（DB：medical_ai） |

## 二、部署指令

gcloud run deploy medical-backend --source backend --region asia-east1 --allow-unauthenticated --project medical-ai-489522

## 三、LINE 設定

| 項目 | 內容 |
|------|------|
| 官方帳號 | 360醫美AI智能顧問（平台總 OA） |
| Channel ID | 2009297793 |
| LIFF ID | 2009360724-7DzjBKHU |
| Webhook | https://medical-backend-492121133498.asia-east1.run.app/webhook/line |

預約系統使用同一個 OA + LIFF，帶 clinic_id 參數判斷診所身份。每個診所不另開獨立 OA。

## 四、資料規模

| 檔案 | 筆數 |
|------|------|
| clinics_real.json | 904筆診所 |
| nhi_all.json | 24,321筆NHI |
| places_results.json | 904筆Google評分 |
| judicial_results.json | 904筆（496家有案件） |
| clinic_reviews | 13,600+則Google評論 |

## 五、評鑑體系

診所六維度：
- 司法糾紛 ✅
- Google評分 ✅
- 合法登記 ✅
- 行政處分 ⏳ P4
- 新聞媒體 ⏳ P3 AIMS串接
- 社群討論 ⏳ P3 AIMS串接

醫師五維度：
- 執照合法性 ✅
- 司法糾紛 ✅
- 行政處分 ⏳ P4
- 新聞媒體 ⏳ P3 AIMS串接
- 社群口碑 ⏳ P3 AIMS串接

## 六、✅ 已完成

- 前端展示版上線（Vercel）
- Gemini 2.5 Flash LINE AI顧問
- LIFF串接（含auto_unlock）
- 診所/醫師Flex報告卡片
- 霧化報告
- 904家真實診所資料
- Google Places評分（904家）
- Google Places真實評論（13,600+則，clinic_reviews表）
- 衛福部醫師即時查詢
- 司法院裁判書（904家）
- 三維度整合進診所詳細頁
- Schema.org + Sitemap + generateMetadata
- Admin後台13模組 P1 mock 全部完成
- PostgreSQL真實DB（Cloud SQL）
- GCP Cloud Scheduler三個排程
- Admin後台接真實DB
- 前台AI SEO頁面（城市/FAQ/專欄/百科/比較）
- 診所列表904筆+臺台篩選修正

## 七、✅ P2 已完成

| # | 項目 | 說明 |
|---|------|------|
| ✅ 1 | 全台診所資料館重構 | 縣市分組、partner amber雙層版面、/clinics 統一 |
| ✅ 2 | 優惠療程搜尋 | /promotions 四維篩選、API proxy、合作診所排前 |
| ✅ 3 | 我想合作頁面 | /partnership 表單、POST /api/partnership/inquiry、導向 LINE OA |
| ✅ 4 | 輕量診所後台 | /portal/login + 七模組、JWT auth、compliance 審核 |
| ✅ 5 | Admin LINE OA 數據儀表板 | /admin/line、SVG趨勢圖、熱門問題、診所轉換 |
| ✅ 6 | Admin CMS 審核流程 | /admin/cms 重寫、合規警告標記、禁用詞管理 |
| ✅ 7 | 預約客服系統 | /booking LIFF五步驟、human_mode靜默、/admin/appointments 管理 |
| ✅ 8 | 前台視覺重設計 | 1-7頁面全視覺翻新 |
| ✅ 9 | Admin後台視覺重設計 | Sidebar #1A202C + 七大模組 Dashboard/預約/LINE/CMS/排程/診所/合作診所 |
| ✅ 10 | Admin bypass進入診所後台 | /admin/clinics「進入後台」、/admin/partners「進入後台」、portal紫色代理橫幅、bearer bypass auth |

## 八、⏳ P3 待開發（AIMS完成後）

| # | 項目 | 說明 |
|---|------|------|
| 1 | AIMS SSO橋接 | 診所後台與AIMS打通，單一登入 |
| 2 | 醫美專欄/FAQ串接 | AIMS AI生成 → 推送醫美平台 → 審核上架 |
| 3 | Admin AI顧問調校介面 | 語氣/引導邏輯/合規詞統一調控，A/B測試話術 |
| 4 | 口碑監測串接 | AIMS口碑數據進醫美後台 |
| 5 | 診所Email通知 | 新預約時Email通知診所諮詢師 |

## 九、⏳ P4 上線後

- 衛福部行政處分爬蟲（來源待確認）
- 診所↔醫師對應（改為診所自填）
- 正式網域購買+綁定Vercel
- 預約抽傭金額計算與對帳系統
- 多醫療產業擴充
- 付費解鎖/訂閱制

## 十、與AIMS串接（P3）

- 醫美平台在AIMS視為一個客戶，使用全部13項行銷工具
- 診所客戶付費後可使用AIMS所有行銷工具
- 診所點「升級行銷方案」→ 呼叫AIMS API → 自動建立AIMS客戶帳號
- AIMS GitHub：https://github.com/lucashsu28-collab/ai-seo-geo-engine

## 十一、預約客服系統架構

用戶在診所頁面點「立即預約諮詢」
→ 開啟 LIFF /booking?clinic_id=xxx
→ 五步驟完成預約（療程→時間→姓名電話→備註→確認）
→ POST /api/appointments 寫入DB
→ 推播LINE確認訊息給用戶
→ 系統切換該用戶對話為人工客服模式（AI靜默）
→ 通知診所諮詢師 → 直接在LINE OA Manager接聊
→ 諮詢完成後 Admin 點「恢復AI模式」→ AI重新接管

抽傭追蹤：每筆預約記錄 clinic_id，月結報表 P4 計算金額。

## 十二、診所後台模組清單（/portal/[clinic_id]）

| 路徑 | 功能 |
|------|------|
| /portal/login | Email+密碼登入 |
| /portal/[id] | 數據看板（瀏覽數/預約數/上架優惠數） |
| /portal/[id]/info | 基本資料編輯 |
| /portal/[id]/treatments | 療程管理 |
| /portal/[id]/promotions | 優惠管理（含審核狀態顯示） |
| /portal/[id]/doctors | 醫師團隊管理 |
| /portal/[id]/gallery | 照片Gallery管理 |
| /portal/[id]/appointments | 預約列表（唯讀） |

## 十三、協作規則

- Lucas（帥帥老大）= 產品決策
- Claude = 架構規劃 + 給指令
- 給 C 的所有指令：全部放在單一框內，一鍵複製
- 給 Lucas 的 PowerShell：全部放在單一框內，一鍵複製
- 兩種框不可混在一起
- 繁體中文溝通
- 完成後 git commit + push
