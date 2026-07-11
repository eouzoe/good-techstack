# good-techstack

你的產品點子。一行指令。上線。

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | bash
```

---

你有一個想法。你想把它做出來、放上線、看看能不能成。

你不想花好幾個星期搞基礎架構、研究該用哪個認證套件、除錯設定檔、或第五次重複寫樣板程式碼。

這套技術棧是為你準備的。

---

## prototype 和 product 之間的差距

Vibe coding 很好玩。你描述一個東西，AI agent 自動產生，瀏覽器上看起來沒問題。

然後你想把它上線。

沒有資料庫。沒有登入。沒有地方放。prototype 只有一個頁面，但你現在需要認證、資料儲存、錯誤處理、部署、網域名稱——那些 prototype 從來不需考慮的事。

Good-techstack 填補了這個差距。

從一行指令開始，它就給你：

- 一個能用的後端，而且持續能用
- 一個不需要管理的資料庫
- 一個開箱即用的認證系統
- 一個在任何地方都載入很快的前端
- 一個在有用戶之前完全免費的基礎設施
- 一個理解每個部分的 AI agent

這些不是選配。它們是「看起來像產品」和「真的是產品」之間的差別。

---

## 給你的 AI agent

這是改變你開發方式的關鍵。

大部分的開發技術棧是為人類閱讀說明文件而設計。Good-techstack 同時為人類和 AI agent 而設計。

你的 agent 讀取文件——刻意為它而寫——然後理解：

- **有哪些工具**，該用哪個。它不會建議 Prisma 或 Next.js 或 Redis。它們不在這套棧裡。
- **該裝什麼版本**。它會先確認，不會用猜的。
- **該遵循什麼模式**，該避開什麼。每個常見錯誤都有記錄和替代方案。
- **如何驗證自己的工作**。必須通過七層測試矩陣，任務才算完成。

結果是一個每次都能產出可執行程式碼的 agent。不是看起來合理、但執行就壞掉的程式碼。

當你告訴 agent「加一個登入頁面」，你得到一個登入頁面——有 session、token 刷新、OAuth 登入、CSRF 保護——因為 agent 知道認證套件、讀過它的設定、遵循既有的模式。

當你告訴 agent「部署」，它就部署了。資料庫已建立。環境已設定。服務已上線。

這就是 agent 理解整個技術棧之後發生的事。

---

## 你得到什麼

| 項目 | 內容 |
|------|------|
| 執行環境 | Bun — 快到冷啟動不是問題 |
| API | Hono + oRPC — 從前端到資料庫型別安全 |
| 資料庫 | D1 — 邊緣 SQLite，零管理 |
| 認證 | better-auth — 郵件、OAuth、SSO，全包 |
| 前端 | TanStack Start — React，快速，型別安全 |
| UI | shadcn/ui — 好看又好用的元件 |
| Linter | oxlint — 幾百條規則，在你注意到之前就跑完了 |
| 部署 | Cloudflare Workers — 在成長之前完全免費 |
| 環境 | Nix — 一行指令，所有人環境完全一致 |

全部經過測試。全部型別安全。全部部署到全球邊緣。

---

## 怎麼運作

```
你的 AI agent 讀 docs/ → 理解整個技術棧

         TanStack Start (React + SSR + RSC)
         shadcn/ui · Tailwind · TypeScript

         Cloudflare Workers (Hono + oRPC)
         better-auth · Zod · Drizzle

    D1  │  R2  │  KV  │  Queues  │  DO  │  Email
```

你專注商業邏輯，技術棧處理其他一切。

---

## 開始

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | bash
```

這行指令：

1. 下載 good-techstack 和一個 AI agent（如果你還沒有的話）
2. 啟動 agent
3. Agent 引導你建立 Cloudflare 帳號
4. 設定開發環境
5. 透過對話了解你的產品點子
6. 產生程式碼——schema、資料庫、API、前端
7. 部署上線

你只需要兩樣東西：**一台能上網的電腦** 和 **一個產品點子**。

---

## 給開發者

完整技術文件在 `docs/`。從 `docs/getting-started.md` 開始。

- [開發指南](docs/guide/) — 開發流程、部署、測試
- [技術參考](docs/reference/) — 各層深入分析（執行環境、API、資料庫、認證、前端、Schema、基礎設施、TypeScript）
- [設計決策](docs/reference/design-decisions.md) — 為什麼選這些技術
- [AI 助手](docs/agent/) — 助手規則、啟動、建立商業邏輯、MCP 參考
- [貢獻指南](CONTRIBUTING.md)

---

這個專案不追求最強、最完整、最優雅。它追求讓你**開始**。

你的點子，上線。就是這樣。

其他都是設定。
