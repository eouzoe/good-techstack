# Agent 行為規則

> 本文檔寫給 agent。違反這些規則會產出不可接受的結果。
> 最後更新：2026-07-12

## 1. 引用來源

- 每個非顯而易見的陳述必須附上來源（URL 或檔案路徑）。
- 版本資訊必須來自官方查詢（`npm view`、`bun --version`），不可來自記憶。

## 2. 不要猜測版本

- 如果你不確定正確版本，說：「我不確定。請執行 `npm view <package> version`。」
- 不要未附來源就說「最新版本是 X.Y.Z」。
- 用 `just check-versions` 確認目前的工具與依賴版本，它直接讀取 `bun.lock` 與 `package.json`（沒有手動維護的版本表）。

## 3. 拒絕非本棧工具

- 不要提 Prisma（此棧用 Drizzle）。不要提 Next.js（此棧用 TanStack Start）。不要提 ESLint（此棧用 oxlint）。
- 例外：使用者明確要求比較時，先說明此棧的選擇，再比較。
- 標準回答模板：「此棧使用 X（見 `docs/reference/X.md`）。Y 雖然是選項，但不在此棧範圍。」

## 4. 閱讀順序

處理任何與此棧相關的請求前，agent 必須：

1. 讀 `docs/getting-started.md` 了解結構。
2. 讀 `docs/reference/design-decisions.md`（不可違反的原則）。
3. 讀相關的 `docs/reference/*.md` 或 `docs/guide/*.md`。
4. 如果是新專案或使用者在描述新產品點子，讀 `docs/agent/scaffolding.md`。
5. 執行 `just check-versions` 確認依賴版本是否最新。

### 新專案流程

如果你是由 `start.sh` 啟動的，初始提示是 `docs/agent/bootstrap-prompt.md`。依序執行。

如果沒有 bootstrap prompt（使用者已有此棧）：

1. 讀 `docs/getting-started.md` 了解概覽。
2. 讀 `docs/agent/scaffolding.md` 並遵循 Q&A 協議。
3. 未完成探索階段前，不要開始產生程式碼。
4. 強制執行審查機制：需要確切的確認詞。

## 5. 輸出格式

- 回答前引用來源（檔案路徑 + 行號或章節名）。
- 程式碼範例標註檔案路徑。
- 不要輸出不相關的前言或後語。
- 盡量用條列而非段落。

## 6. 文件更新紀律

- 改檔案前：讀 `docs/getting-started.md` 了解上下文。
- 改完後：寫入 `CHANGELOG/`。建立 `CHANGELOG/YYYY-MM-DD-slug.md`。
- 不要修改此專案外的檔案。

## 7. 安全

- 不要在任何地方輸出 API token、金鑰或密碼。
- 使用檔案變數語法 `{file:~/.cloudflare/mcp-token}` 來引用 token，絕不使用實際值。
- CI secrets 透過 GitHub Secrets 注入，不要寫在程式碼或文件中。
- 讀取或寫入任何 secret 前：先讀 `secretspec.toml` 確認 key 是否存在。
- 使用 `secretspec run -- <cmd>` 將 secret 注入到指令中。不要透過 `--env` 參數傳遞 secret。
