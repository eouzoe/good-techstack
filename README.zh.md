# good-techstack

一行指令。一場對話。你的產品，直達邊緣。

---

## 快速開始

```bash
curl -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh
```

<sub>**Windows 使用者：** 請先以系統管理員身分開啟命令提示字元，執行以下指令（將安裝 NixOS-WSL，約 550 MB）：</sub>

```cmd
curl -L -o %TEMP%\n.wsl "https://github.com/nix-community/NixOS-WSL/releases/latest/download/nixos.wsl" && wsl --install --from-file %TEMP%\n.wsl
```

<sub>接著在 NixOS-WSL 終端機中執行上方的 curl 指令。</sub>
<sub>**Intel Mac 使用者：** 腳本會自動偵測架構，使用上游 Nix 安裝器。</sub>

這一行指令會下載完整專案、安裝 Nix + devenv，然後進入互動式開發環境。接下來交給 AI，或者自己動手。

---

## 給你的 AI 助手

把這段提示詞複製給 Claude Code、Codex、opencode 或其他 AI 程式設計助手：

````markdown
你正在設定一個 good-techstack 專案。請自行偵測環境後獨立完成以下步驟。

1. **識別作業系統** — 執行 `uname -s` 和 `uname -m`，根據結果決定行為：
   - **macOS (arm64 / Apple Silicon)：** 安裝腳本使用 Determinate Nix。完成後設定 `extra-trusted-substituters` 加速下載。
   - **macOS (x86_64 / Intel)：** 安裝腳本使用上游 Nix 安裝器。同上，安裝後最佳化。
   - **Linux（原生）：** 使用 Determinate Nix 安裝器。先確認是否已有 Nix。
   - **WSL / NixOS-WSL：** Nix 已存在，跳過安裝，直接執行 `devenv allow`。
   - **其他：** 執行 `curl -fsSL https://raw.githubusercontent.com/eouzoe/good-techstack/main/scripts/start.sh | sh` 並處理錯誤。

2. **確保 Nix 可用。** 若缺少，執行 `sh scripts/start.sh`。

3. **針對平台最佳化環境：**
   - macOS：在 `/etc/nix/nix.conf`（或 `~/.config/nix/nix.conf`）加入 `extra-trusted-substituters = https://cache.nixos.org https://devenv.cachix.org`，然後重新啟動 nix-daemon。
   - NixOS / NixOS-WSL：確保 `nix.settings.substituters` 包含快取 URL 以加速下載。
   - Windows WSL：確認 `/etc/wsl.conf` 有 `[wsl2] kernelSettings=true`，建議分配 8 GB 記憶體。

4. **安裝 AI 工具**（若尚未安裝）：
   - 優先使用 Claude Code：`nix profile add nixpkgs#claude-code` 或 `npm i -g @anthropic-ai/claude-code`
   - 備用 Codex：`nix profile add nixpkgs#codex-cli`
   - 備用 opencode：`nix profile add nixpkgs#opencode`
   - 如果都沒有，安裝 opencode（體積最小）。

5. **處理身分驗證：**
   - Cloudflare API 金鑰：引導使用者在 https://dash.cloudflare.com/profile/api-tokens 建立（範本：Workers:Edit），儲存至 `~/.cloudflare/mcp-token`。
   - 若 AI 助手需要自己的 API 金鑰，引導使用者註冊。

6. **初始化專案：** 在 `devenv shell` 中執行 `just init`，這會產生 D1 型別繫結、執行型別檢查，並設定本機開發用密鑰。

7. **閱讀引導協議：** 開啟 `docs/en/agent/bootstrap-prompt.md` 逐步執行。接著閱讀 `docs/en/agent/scaffolding.md` 了解產品探索協議。

8. **開始對話：** 對使用者進行 7 道產品探索提問。在實體地圖經過確認之前，不要產生任何程式碼。
````

把這段貼到任何 AI 程式設計助手的對話中。助手會自動偵測作業系統、安裝依賴、最佳化環境，然後開始建構——你只需要回答關於產品點子的問題。

---

## 這套工具有什麼不同

### Zod 4 鏈結——從資料庫到瀏覽器，型別一路貫穿

單一份 Zod 綱要就能產出資料庫型別、API 合約、表單驗證、以及身分驗證設定。沒有重複。沒有偏差。一個真相來源，貫穿所有層級：

```
packages/shared/ → Zod schema（唯一真相來源）
  ├── Drizzle ORM：  z.infer<> 對應 D1 資料列型別
  ├── oRPC：         .input(UserCreate).output(UserResponse)
  ├── TanStack Form： zodResolver(UserCreate)
  └── better-auth：   外掛設定也是 Zod
```

### 全端 TypeScript，不只你的程式碼

整個管道都是型別安全的——`wrangler.toml` 繫結、D1 查詢、Hono 路由、oRPC 合約、前端元件、環境變數。編譯過就代表能跑。不會有型別不符的執行期意外。

### 開發體驗，規模化

|        | 這代表什麼                                           |
| ------ | ---------------------------------------------------- |
| **DX** | Bun 冷啟動 1.2 毫秒。oxlint 比 ESLint 快 50 倍。`just dev` 同時啟動前後端。修改即時反映。 |
| **AX** | AI 助手讀的文件是為它寫的，不是為你。它知道該用哪個工具、該裝哪個版本、該遵循哪種模式。每一步都會先驗證再繼續。 |
| **安裝** | 一行指令。不需要 Homebrew、asdf、Docker。Nix + devenv 讓每個人的環境一模一樣。 |

### 供應鏈鎖定

- `devenv.lock` 鎖定精確的 nixpkgs 提交（工具鏈雜湊值）
- `bun.lock` 鎖定每一個 JavaScript 相依套件
- Cloudflare Workers 沙箱隔離你的執行環境

---

## 這組工具包含了什麼

| 項目         | 說明                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| 執行引擎     | Bun — 快到讓你忘了冷啟動的存在                                           |
| API          | Hono + oRPC — 從邊緣到資料庫，全程型別安全                               |
| 資料庫       | D1 — 邊緣 SQLite，零管理                                                |
| 身分驗證     | better-auth — 信箱、OAuth、SSO，開箱即用                                 |
| 前端         | TanStack Start — React、SSR、RSC，到處都快                               |
| UI 元件      | shadcn/ui — 開箱就好用的元件庫                                          |
| 程式碼檢查   | oxlint — 數百條規則，你還沒注意到就跑完了                                |
| 部署平台     | Cloudflare Workers — 有使用者之前都免費                                  |
| 開發環境     | Devenv 2.x + Nix — 一行指令，每個人的環境一模一樣                        |

全部型別安全。全部測試過。全部部署到邊緣。

---

## 運作方式

```
你的 AI 助手閱讀 docs/en/ → 理解整個技術棧

         TanStack Start（React + SSR + RSC）
         shadcn/ui · Tailwind · TypeScript

         Cloudflare Workers（Hono + oRPC）
         better-auth · Zod · Drizzle

    D1  │  R2  │  KV  │  Queues  │  DO  │  Email
```

你專注於商業邏輯。技術棧搞定其餘一切。

---

## 詳細安裝流程

快速開始指令一次完成所有步驟。以下是實際發生的過程：

1. 下載最新的 good-techstack 至 `./my-app/`
2. 若缺少 **Nix** 則安裝（Apple Silicon + Linux 使用 Determinate Nix，Intel Mac 使用上游 Nix，NixOS-WSL 跳過）
3. 透過 `nix profile add` 安裝 **devenv**
4. 信任專案目錄（`devenv allow`）
5. 進入 `devenv shell`——互動式環境，`bun`、`node`、`oxlint`、`oxfmt`、`wrangler`、`just`、`typescript` 都已就緒

在 shell 中：

```bash
bun install               # 安裝 JavaScript 相依套件
just init                 # 產生繫結、型別檢查、設定開發密鑰
just dev                  # 啟動前後端開發伺服器
```

接著使用 AI 助手（貼上上方的提示詞），或自行探索 `docs/zh-Hant/` 中的文件。

---

## 給開發者

完整技術文件在 `docs/`。

- [技術參考](docs/zh-Hant/reference/00-runtime.md) — 各層深入分析
- [設計決策](docs/en/reference/design-decisions.md)（英文）
- [AI 助手](docs/zh-Hant/agent/) — 規則、啟動、產品建構
- [版本檢查](docs/zh-Hant/guide/version-check.md)
- [本機環境檢查](docs/zh-Hant/guide/env-check.md)
- [英文文件](docs/en/) — 最完整的原始版本

---

## 卡住了？

到 [github.com/eouzoe/good-techstack/issues/3](https://github.com/eouzoe/good-techstack/issues/3) 告訴我們你在什麼系統上、發生了什麼事。不用術語，直接寫就好。

---

你的點子，上線。就這麼一回事。
