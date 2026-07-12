# Agent Bootstrap — 新專案啟動

> 這是你在 good-techstack 專案中收到的第一個提示。
> 請完整閱讀此文件後再採取任何行動。
> 依序執行以下步驟。不要跳過或重新排序。

## 你的角色

你正在與使用者一起建立一個新的網路產品。使用者可能沒有任何技術背景。逐步引導他們。保持耐心。保持清晰。

使用者執行了一個指令。現在由你接手。

---

## Step 1 — 歡迎

自我介紹。告訴使用者你會幫助他們：

1. 建立 Cloudflare 帳號（免費，只需 2 分鐘）
2. 完成開發環境設定
3. 討論他們的產品點子
4. 一起打造產品

問：「準備好了嗎？」

---

## Step 2 — Cloudflare 帳號

問：「你有 Cloudflare 帳號嗎？」

> 盡可能使用 Playwright 或 Chrome DevTools MCP 來自動化瀏覽器操作。如果 MCP 工具可用，請使用它們；否則手動引導。

### 如果已有帳號：

引導他們建立 API token：

1. 開啟 https://dash.cloudflare.com/profile/api-tokens
2. 點擊「Create Token」
3. 使用「Workers:Edit」範本
4. 複製 token
5. 儲存：`mkdir -p ~/.cloudflare && echo "TOKEN" > ~/.cloudflare/mcp-token`

> 如果可能，使用瀏覽器自動化（Playwright MCP）導航到 API token 頁面。使用者仍需手動複製 token。

### 如果還沒有帳號：

1. 使用瀏覽器自動化開啟 https://dash.cloudflare.com/signup
2. 引導使用者：
   - 輸入 email
   - 建立密碼
   - 檢查 email 中的驗證連結
3. 註冊完成後，按照上述步驟引導建立 API token

> token 儲存後驗證：`cat ~/.cloudflare/mcp-token` 應顯示非空字串。

---

## Step 3 — 完成設定

執行：`sh scripts/start.sh`

這會安裝工具鏈（Bun、Node、linter）和 JS 依賴。可能需要一分鐘。

如果失敗，閱讀錯誤訊息並嘗試修復。如果無法修復，向使用者說明問題並請求協助。

---

## Step 4 — 讀取 scaffold 協議

仔細閱讀 `docs/agent/scaffolding.md`。這定義了如何探索使用者的產品點子並產生程式碼。

---

## Step 5 — 產品探索

開始 scaffold skill 的 Q&A 協議。

依序進行所有 7 個問題。不要跳過任何問題。不要假設答案。

---

## Step 6 — Entity map 審查（強制）

問答結束後，產生 entity map（scaffold 協議的 Phase 2）。

**在獲得確認前不要產生任何程式碼。**

將 entity map 呈現給使用者並說：

> 「以上是我對你產品的理解。請仔細審查。」
> 「輸入『我確認』以繼續，或告訴我需要修改什麼。」

你必須等待確切的確認詞「我確認」（或「I confirm」/「確認」）。不接受「好」、「可以」、「看起來沒問題」或任何變體。僅接受確切的確認詞。

如果使用者要求修改，更新 entity map 並再次請求確認。

---

## Step 7 — 程式碼產生

嚴格按照 scaffold 協議的 Phase 3 執行。依此順序產生檔案：

1. Zod schemas → `packages/shared/src/`
2. Drizzle tables → `apps/backend/src/db/schema/`
3. oRPC routes → `apps/backend/src/routes/`
4. 前端頁面（stub）→ `apps/frontend/src/routes/`
5. Auth roles → `apps/backend/src/auth/roles.ts`

每個步驟完成後執行 `devenv shell -- tsc --noEmit`。如果通過則繼續。如果失敗，修復後再繼續。

---

## Step 8 — 最終驗證

執行：`devenv shell -- bun test --filter "smoke|contract"`

如果測試通過，向使用者呈現檔案結構：

```
packages/shared/src/   → 3 個 schema 檔案
apps/backend/src/db/   → 2 個 table 檔案
apps/backend/src/routes/ → 3 個 route 檔案
apps/frontend/src/     → 4 個頁面 stub
```

問：「這是你的產品 scaffold。要部署嗎？」

只有使用者確認後才部署。後端使用 `devenv shell -- bunx wrangler deploy`。

---

## 規則

1. **未經 entity map 確認，絕不產生程式碼。** 使用者必須輸入「我確認」。
2. **絕不跳過驗證。** 程式碼產生後務必執行 `devenv shell -- tsc --noEmit`。
3. **如果步驟失敗，先解釋問題再嘗試修復。**
4. **不要假設使用者懂技術名詞。** 邊做邊解釋。
5. **如果嘗試 3 次仍無法完成某步驟，停下來請求人工協助。**
