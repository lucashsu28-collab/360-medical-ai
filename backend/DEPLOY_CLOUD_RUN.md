# 後端部署到 GCP Cloud Run

## 一、GCP 建立專案

1. 開啟 [Google Cloud Console](https://console.cloud.google.com/)。
2. 頂部專案下拉選單 → **新增專案**。
3. 輸入專案名稱（例如 `360-medical-ai`）→ **建立**。
4. 選取剛建立的專案，記住 **專案 ID**（之後指令會用到）。

### 啟用計費（Cloud Run 需帳單帳戶）

- 左側選單 **帳單** → 連結帳單帳戶（可設預算上限，避免超支）。
- 若尚未啟用 **Cloud Run API**：左側 **API 與服務** → **程式庫** → 搜尋 **Cloud Run Admin API** → **啟用**。另可一併啟用 **Container Registry** 或 **Artifact Registry**（用於存映像）。

---

## 二、本機準備

### 1. 安裝 Google Cloud CLI（若尚未安裝）

- 下載：<https://cloud.google.com/sdk/docs/install>
- 安裝後執行 `gcloud init`，登入並選定上方的專案。

### 2. 設定專案與地區

```bash
# 設定預設專案（改為你的專案 ID）
gcloud config set project YOUR_PROJECT_ID

# 設定預設地區（例如 asia-east1 台灣）
gcloud config set run/region asia-east1
```

### 3. 環境變數（給 Cloud Run 用）

後端需 `GEMINI_API_KEY`、`LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN` 等，部署時要帶進 Cloud Run（見下方「部署指令」）。  
**不要**把 `.env` 打進 Docker image（已用 `.dockerignore` 排除）。

---

## 三、用 Cloud Run 部署

### 方式 A：從原始碼直接部署（推薦，不用自己建 image）

在 **專案根目錄**（`360-medical-ai`，即含 `backend` 資料夾的那一層）執行：

```bash
gcloud run deploy 360-line-backend \
  --source ./backend \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=你的Gemini金鑰,LINE_CHANNEL_SECRET=你的LINE_Secret,LINE_CHANNEL_ACCESS_TOKEN=你的LINE_Token" \
  --set-env-vars "REDIS_URL=redis://localhost:6379,DATABASE_URL=postgresql://..."
```

- `--source ./backend`：GCP 會依 `backend/Dockerfile` 建 image 並部署。
- `--allow-unauthenticated`：LINE 伺服器才能用 HTTPS 呼叫你的 Webhook（無需登入 GCP）。
- 若環境變數很多，可改用 `--env-vars-file backend/env.yaml`（見下方範例）。

**env 檔案範例（`backend/env.yaml`，勿提交到 Git）：**

```yaml
GEMINI_API_KEY: "AIzaSy..."
LINE_CHANNEL_SECRET: "fd3507c56..."
LINE_CHANNEL_ACCESS_TOKEN: "R7F+bO4cf4Y/..."
REDIS_URL: "redis://localhost:6379"
DATABASE_URL: "postgresql://..."
```

部署指令改為：

```bash
gcloud run deploy 360-line-backend \
  --source ./backend \
  --region asia-east1 \
  --allow-unauthenticated \
  --env-vars-file backend/env.yaml
```

### 方式 B：先建 Docker image 再部署

```bash
# 1. 設定專案與 Artifact Registry（若尚未建立 repo）
gcloud artifacts repositories create 360-repo --repository-format=docker --location=asia-east1

# 2. 建 image（在專案根目錄執行，-f 指定 Dockerfile，最後為 context）
docker build -t asia-east1-docker.pkg.dev/YOUR_PROJECT_ID/360-repo/360-line-backend:latest -f backend/Dockerfile backend

# 3. 推送到 GCP
docker push asia-east1-docker.pkg.dev/YOUR_PROJECT_ID/360-repo/360-line-backend:latest

# 4. 部署到 Cloud Run
gcloud run deploy 360-line-backend \
  --image asia-east1-docker.pkg.dev/YOUR_PROJECT_ID/360-repo/360-line-backend:latest \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=...,LINE_CHANNEL_SECRET=...,LINE_CHANNEL_ACCESS_TOKEN=..."
```

將 `YOUR_PROJECT_ID` 改為你的 GCP 專案 ID。

---

## 四、取得 HTTPS 網址

部署完成後，終端機會顯示服務 URL，例如：

```text
Service [360-line-backend] revision has been deployed and is serving 100 percent of traffic.
Service URL: https://360-line-backend-xxxxx-an.a.run.app
```

或到 Console 查看：

1. [Cloud Run](https://console.cloud.google.com/run) → 選你的服務 **360-line-backend**。
2. 頂部 **網址** 即為 HTTPS 網址。

**LINE Webhook 要填的網址：**

- 路徑為 `/webhook/line`，故完整 URL 為：  
  **`https://你的服務網址/webhook/line`**  
  例：`https://360-line-backend-xxxxx-an.a.run.app/webhook/line`

---

## 五、把網址填回 LINE Webhook URL

1. 登入 [LINE Developers Console](https://developers.line.biz/console/)。
2. 選你的 **Provider** → 選 **Messaging API 頻道**（你的 Bot）。
3. 打開 **Messaging API** 分頁。
4. 找到 **Webhook URL**：
   - 點 **Edit**。
   - 輸入：`https://360-line-backend-xxxxx-an.a.run.app/webhook/line`（換成你的 Cloud Run 網址）。
   - 儲存。
5. 將 **Use webhook** 設為 **Enabled**。
6. （可選）點 **Verify** 測試；若後端正常，會顯示「Success」。

之後使用者傳訊息給 Bot，LINE 會把事件 POST 到該 URL，後端即可回覆。

---

## 六、檢查清單

| 項目 | 說明 |
|------|------|
| GCP 專案 | 已建立並設為 `gcloud config set project` |
| Cloud Run 部署 | `gcloud run deploy ... --source ./backend` 或 image 部署 |
| 環境變數 | GEMINI、LINE 兩組金鑰與 REDIS/DATABASE 已設在 Cloud Run |
| HTTPS 網址 | 從 Cloud Run 服務取得，路徑加 `/webhook/line` |
| LINE Webhook URL | 已設為 `https://<你的服務網址>/webhook/line` 且 Use webhook 啟用 |

若部署或 LINE 驗證有錯誤，可到 GCP Console → **Cloud Run** → 該服務 → **紀錄** 查看請求與錯誤訊息。
