# 360醫療AI大調查 — 開發交接文件
最後更新：2026-05-10 v2（評鑑改五維度，社群口碑下線，每維度 20 分）

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

> ⚠️ `--source` 方式因 Artifact Registry 跨專案權限問題失敗（嘗試 push 到 aims-360），改用本機 Docker build：

```powershell
docker context use default
docker build -t asia-east1-docker.pkg.dev/medical-ai-489522/cloud-run-source-deploy/medical-backend:latest backend/
docker push asia-east1-docker.pkg.dev/medical-ai-489522/cloud-run-source-deploy/medical-backend:latest
gcloud run deploy medical-backend --image asia-east1-docker.pkg.dev/medical-ai-489522/cloud-run-source-deploy/medical-backend:latest --region asia-east1 --allow-unauthenticated --project medical-ai-489522
```

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

## 五、評鑑體系（2026-05-10 v2，五維度每 20 分）

診所五維度：
| # | 維度 | 滿分 | 狀態 | 資料來源 |
|---|------|------|------|---------|
| 1 | 司法糾紛 | 20 | ✅ | 司法院裁判書 |
| 2 | Google 評分 | 20 | ✅ | Google Places |
| 3 | 合法登記 | 20 | ✅ | 衛福部 |
| 4 | 稽查違規紀錄 | 20 | ✅ P3-A | Google News + Gemini 提取（政府公開資料聚合） |
| 5 | 媒體口碑 | 20 | ✅ P3-B | 主流媒體報導（A/B/C 級權威分級 + 業配辨識） |

**總分滿分 100**

社群口碑 2026-05-10 下線（原因：客觀性問題，見 REPUTATION_SCORING.md v2.0）。
後端爬蟲程式 `crawlers/social_mentions.py` 保留但不執行；Cloud Scheduler `social-mentions-update` 已刪除。

醫師頁五維度：留待 P4 實作（依賴 doctors 表，目前用 mock data）

評分規則完整說明：見 [docs/REPUTATION_SCORING.md](REPUTATION_SCORING.md)
稽查紀錄顯示政策：見 [docs/PENALTY_DISPLAY_POLICY.md](PENALTY_DISPLAY_POLICY.md)

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
| ✅ 11 | has_account欄位 | /api/clinics 回傳has_account，admin診所管理「進入後台」按鈕正確顯示 |
| ✅ 12 | 診所詳細頁三欄重構 | 190px篩選sidebar + 1fr主內容 + 210px action sidebar、合作診所四區塊(含empty state)、portal_treatments/portal_promotions串接 |

## 待部署

✅ 2026-04-01 已完整部署（revision: medical-backend-00093-zjg）

## 八、✅ P3 已完成（自建口碑+稽查系統）

### 共通基礎（已上線）
| ✅ | Admin AI顧問調校介面 | 九大區塊，動態組裝 Gemini Prompt + Redis cache |
| ✅ | 診所Email通知 | 新預約時 HTML Email 通知診所，fastapi-mail |
| ✅ | 規則公開頁 | /rules/penalty + /rules/reputation |

### ✅ P3-A：稽查違規紀錄
最終策略：放棄 PDF 解析 + 衛生局案例頁（皆匿名/結構不適），改用 Google News + Gemini 提取單軌
- DB：admin_penalties、penalty_clinic_responses
- 爬蟲：crawlers/penalty_news.py（Google News 7 組關鍵字）
- 共用基底：crawlers/penalty_base.py
- 服務：services/clinic_matcher.py（rapidfuzz）、penalty_severity.py、penalty_extractor.py
- Admin：/admin/penalties 列表 + 觸發按鈕
- 前台：診所頁 PenaltiesSection（3 年完整 / 3-5 年摘要 / 5+ 年隱藏 / 重大永久）
- 診所後台：/portal/[id]/penalties 申訴入口
- Cloud Scheduler：penalty-news-update（每週日 03:00）

### ✅ P3-B：網路媒體口碑
- DB：mentions、reputation_scores、media_authority（17 家預填）、mention_appeals
- 爬蟲：crawlers/news_mentions.py（單次 Gemini call 同時提取機構名+情緒+業配）
- 共用基底：crawlers/mention_base.py（含 pre_* fast-path）
- 服務：services/media_authority.py、sentiment_analyzer.py、news_score.py
- 評分公式：60 + Σ(情緒 × 權威 × 業配 × 衰減 × 5)，cap 0~100
- Admin：/admin/mentions 列表 + 兩個觸發按鈕（news / social）
- 前台：診所頁 MentionsSection（第 5 維度，新聞）
- Cloud Scheduler：news-mentions-update（每週日 04:00）

### 🚫 P3-C：社群口碑（已下線 2026-05-10）
原本實作後因「客觀性不足」（水軍/業配/反爬），合併到媒體口碑單一維度。
- 程式碼保留：crawlers/social_mentions.py
- 前台維度卡：移除
- Cloud Scheduler：刪除
- 後台介面：admin_mentions 強制 source_type=news

### ✅ P3-D-1：聲譽趨勢圖
- routers/clinic_trend.py + components/ReputationTrendChart.tsx
- 30/90/180 天三線圖（新聞/社群/稽查）

### ⏳ P3-D 未完成項目（轉 P4）
- D-2 醫師頁五維度整合（需先建 doctors 表，現用 mock data 不適合直接接）
- D-3 評分試算器（客服工具，輔助價值低）
- D-4 全平台 Top 10 dashboard（admin 內部工具）

### ⏳ P3-E：AIMS 整合（看 AIMS 進度）
| ⏳ 1 | AIMS SSO 橋接 |
| ⏳ 2 | 醫美專欄/FAQ AIMS 推送 |

## 九、⏳ P4 上線後

- 診所↔醫師對應（改為診所自填）→ 建 doctors 表
- 醫師頁五維度整合（依賴 doctors 表）
- 評分試算器（客服工具）
- 全平台 Top 10 正面/負面 dashboard
- 正式網域購買+綁定Vercel
- 預約抽傭金額計算與對帳系統
- 多醫療產業擴充
- 付費解鎖/訂閱制
- FB 社團 / IG / TikTok 口碑（API 限制需第三方或人工）
- Dcard / Mobile01 / 痞客邦直爬（需付費 API 或代理）
- 衛生局新聞稿頁直爬（補充 Google News 沒收錄的）

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
