# 360醫療AI大調查 — 開發交接文件
最後更新：2026-03-29

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
```bash
gcloud run deploy medical-backend --source backend --region asia-east1 --allow-unauthenticated --project medical-ai-489522
```

## 三、LINE 設定

| 項目 | 內容 |
|------|------|
| 官方帳號 | 360醫美AI智能顧問（平台總 OA） |
| Channel ID | 2009297793 |
| LIFF ID | 2009360724-7DzjBKHU |
| Webhook | https://medical-backend-492121133498.asia-east1.run.app/webhook/line |

> 每個合作診所另有專屬 LINE OA（登記平台名下，診所付費取得使用權）

## 四、資料規模

| 檔案 | 筆數 |
|------|------|
| clinics_real.json | 904筆診所 |
| nhi_all.json | 24,321筆NHI |
| places_results.json | 904筆Google評分 |
| judicial_results.json | 904筆（496家有案件） |
| clinic_reviews | 13,600+則Google評論 |

## 五、評鑑體系

**診所六維度**
- 司法糾紛 ✅
- Google評分 ✅
- 合法登記 ✅
- 行政處分 ⏳ P4
- 新聞媒體 ⏳ P3 AIMS串接
- 社群討論 ⏳ P3 AIMS串接

**醫師五維度**
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

## 七、⏳ P2 待開發（現在進行）

| # | 項目 | 說明 |
|---|------|------|
| 1 | 全台診所資料館重構 | 選單文字改「全台診所資料館」；未付費（陽春頁）/ 付費（精美頁）雙層設計 |
| 2 | 優惠療程搜尋 | 選單文字改「優惠療程搜尋」；療程卡片 → 有優惠診所列表 → 連預約系統 |
| 3 | 我想合作頁面 | 表單（診所名稱/聯絡方式/詢問內容）→ 送出後導向平台總 LINE OA |
| 4 | 輕量診所後台 | 診所管理自己頁面資料、療程項目、優惠上架（B方案，未來P3與AIMS合併） |
| 5 | Admin LINE OA 數據儀表板 | 總對話數、熱門問題Top10、各診所導流轉換率 |
| 6 | Admin CMS 審核流程 | 內容上架前合規審核 + 醫療廣告關鍵字過濾（禁用：保證/絕對/最好/具體數字療效） |
| 7 | 預約客服系統 | 診所專屬LINE OA（登記平台名下）、LINE內預約流程、後台管理、抽傭追蹤報表 |

## 八、⏳ P3 待開發（AIMS完成後）

| # | 項目 | 說明 |
|---|------|------|
| 1 | AIMS SSO橋接 | 診所後台與AIMS打通，單一登入 |
| 2 | 醫美專欄/FAQ串接 | AIMS AI生成 → 推送醫美平台 → 審核上架 |
| 3 | Admin AI顧問調校介面 | 語氣/引導邏輯/合規詞統一調控，A/B測試話術 |
| 4 | 口碑監測串接 | AIMS口碑數據進醫美後台 |

## 九、⏳ P4 上線後

- 衛福部行政處分爬蟲（來源待確認）
- 診所↔醫師對應（改為P3-4診所自填）
- 正式網域購買+綁定Vercel
- 預約系統串接外部系統（選配）
- 多醫療產業擴充
- 付費解鎖/訂閱制

## 十、與AIMS串接（P3）

- 醫美平台在AIMS視為一個客戶，使用全部13項行銷工具
- 診所客戶付費後可使用AIMS所有行銷工具
- 診所點「升級行銷方案」→ 呼叫AIMS API → 自動建立AIMS客戶帳號
- AIMS GitHub：https://github.com/lucashsu28-collab/ai-seo-geo-engine

## 十一、預約客服系統架構
```
平台總LINE OA（AI顧問說服用戶）
    ↓
轉介診所專屬LINE OA（平台名下，診所付費使用）
    ↓
LINE內完成預約（療程→時間→資料→確認）
    ↓
預約資料進平台後台
    ↓
診所從後台確認預約 → 用戶收通知
    ↓
完成後計入抽傭報表
```

## 十二、協作規則

- Lucas（帥帥老大）= 產品決策
- Claude = 架構規劃 + 給指令
- 給 Code 的指令：全部放在單一框內，一鍵複製
- 給 Lucas 的 PowerShell：全部放在單一框內，一鍵複製
- 兩種框不可混在一起
- 繁體中文溝通
- 完成後 git commit + push
