# good-techstack

一行指令。你的產品，直達邊緣。

---

## 快速開始

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh
```

Apple Silicon 和 Intel 都相容。任何 Linux 發行版也都沒問題。

### Windows

第一步 — **命令提示字元（系統管理員）**：

```cmd
curl -L -o %TEMP%\n.wsl "https://github.com/nix-community/NixOS-WSL/releases/latest/download/nixos.wsl" && wsl --install --from-file %TEMP%\n.wsl
```

第二步 — 在開啟的 NixOS-WSL 終端機中，執行與上方相同的 curl 指令。

---

進入 shell 後：

```bash
bun install
just init
just dev
```

執行 `just agent` 交給 AI 助手。它會自動偵測環境、安裝 Agent（若無）、開始產品探索對話——不需手動設定。

---

## 直接餵給 AI（不安裝腳本）

把這段提示詞當作初始指令給 Claude Code、Codex、opencode 或其他程式設計助手。AI 會自行處理後續一切。

````markdown
你正在設定一個 good-techstack 專案。請自行偵測環境後獨立完成以下步驟。

1. **識別作業系統** — 執行 `uname -s` 和 `uname -m`，根據結果決定行為：
   - **macOS (arm64 / Apple Silicon)：** 安裝腳本使用 Determinate Nix。完成後設定 `extra-trusted-substituters` 加速下載。
   - **macOS (x86_64 / Intel)：** 使用上游 Nix 安裝器。同上，安裝後最佳化。
   - **Linux（原生）：** 使用 Determinate Nix 安裝器。先確認是否已有 Nix。
   - **WSL / NixOS-WSL：** Nix 已存在，跳過安裝，直接執行 `devenv allow`。
   - **其他：** 執行 `curl -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh` 並處理錯誤。

2. **確保 Nix 可用。** 若缺少，執行 `sh scripts/start.sh`。

3. **針對平台最佳化環境：**
   - macOS：在 nix config 加入 `extra-trusted-substituters`，重啟 nix-daemon。
   - NixOS / NixOS-WSL：確保 `nix.settings.substituters` 包含快取 URL。
   - WSL：確認 `/etc/wsl.conf` 記憶體足夠（建議 8 GB）。

4. **安裝 AI 工具**（若尚未安裝）：
   - 優先使用 Claude Code：`nix profile add nixpkgs#claude-code`
   - 備用 Codex：`nix profile add nixpkgs#codex-cli`
   - 備用 opencode：`nix profile add nixpkgs#opencode`

5. **處理身分驗證：**
   - Cloudflare API 金鑰：引導使用者在 https://dash.cloudflare.com/profile/api-tokens 建立（範本：Workers:Edit），儲存至 `~/.cloudflare/mcp-token`。
   - 若 AI 助手需要自己的 API 金鑰，引導使用者註冊。

6. **初始化專案：** 在 `devenv shell` 中執行 `just init`——產生 D1 型別繫結、型別檢查、設定開發密鑰。

7. **閱讀引導協議：** 開啟 `docs/en/agent/bootstrap-prompt.md` 逐步執行。接著閱讀 `docs/en/agent/scaffolding.md` 了解產品探索協議。

8. **開始對話：** 對使用者進行 7 道產品探索提問。在實體地圖經過確認之前，不要產生任何程式碼。
````

---

## 這組工具包含了什麼

| 項目         | 說明                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| 執行引擎     | Bun — 冷啟動 1.2 毫秒                                                   |
| API          | Hono + oRPC — contract-first，從邊緣到資料庫全程型別安全                  |
| 資料庫       | D1（SQLite）+ Drizzle ORM — 零管理                                      |
| 身分驗證     | better-auth — 信箱、OAuth、SSO、工作階段                                 |
| 前端         | TanStack Start — React、SSR、RSC                                        |
| UI 元件      | shadcn/ui — Tailwind CSS 4                                              |
| 程式碼檢查   | oxlint — 840+ 規則，比 ESLint 快 50 倍                                   |
| 格式化       | oxfmt — Rust 實作，比 Prettier 快 30 倍                                  |
| 基礎設施     | Cloudflare Workers — D1、R2、KV、Queues、DO、Email                      |
| 開發環境     | Nix + devenv 2.x — 可重現的 shell，一行指令                              |

全部 TypeScript。全部型別安全到邊緣。

---

## 為什麼選這套

**Zod 4 是唯一的真相來源。** 一份綱要產生資料庫型別、API 合約、表單驗證、身分驗證設定。沒有重複，沒有偏差：

```
packages/shared/ → Zod schema
  ├── Drizzle ORM：    z.infer<> → D1 資料列型別
  ├── oRPC：           .input(UserCreate).output(UserResponse)
  ├── TanStack Form：  zodResolver(UserCreate)
  └── better-auth：    外掛設定也是 Zod
```

**全端型別安全。** `wrangler.toml` 繫結、D1 查詢、Hono 路由、前端元件、環境變數——編譯過就代表能跑。

**安全預設。** SecretSpec 取代 `.env`（密鑰絕不寫入版本控制）。相依版本鎖在 `devenv.lock` + `bun.lock`。Workers 沙箱隔離每個請求。better-auth 處理 Argon2id 雜湊、JWT 工作階段、CSRF、OAuth。

---

## 給開發者

完整技術文件在 `docs/`。

- [技術參考](docs/zh-Hant/reference/00-runtime.md)
- [設計決策](docs/en/reference/design-decisions.md)（英文）
- [AI 助手](docs/zh-Hant/agent/)
- [版本檢查](docs/zh-Hant/guide/version-check.md)
- [本機環境檢查](docs/zh-Hant/guide/env-check.md)
- [英文文件](docs/en/)

---

## 卡住了？

[開一個 issue](https://github.com/eouzoe/good-techstack/issues/3) — 告訴我們你在什麼系統上、發生了什麼事。不用術語，直接寫。

---

你的點子，上線。就這麼一回事。
