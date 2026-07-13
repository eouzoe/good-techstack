# 貢獻指南

Good-techstack 還在很早期的階段。歡迎任何形式的貢獻。

---

## 如何貢獻

- **Issue**：回報 bug、提建議、發問。
- **Pull request**：修 bug、加功能、改進文件。
- **Discussion**：分享你使用這套技術堆疊的經驗。

開 PR 之前，請先確認你的修改能通過 CI 關卡：

```bash
just typecheck     # tsc --noEmit
```

## 程式碼風格

- 不要寫多餘的註解。程式碼要能自我說明。
- 遵循 `docs/reference/` 裡的模式。
- 所有新功能都要有測試。

---

## 版本維護

所有工具與函式庫的版本都記錄在鎖定檔裡，不是手寫清單。要檢查依賴是否過時：

```bash
just check-versions
```

這會把每個直接依賴（`package.json` 裡宣告的）對照 npm 上的最新版本。完整說明——包含不含版本的套件清單，以及如何檢查非 npm 套件（node、devenv、nix、secretspec）——在 [`docs/guide/version-check.zh.md`](docs/guide/version-check.zh.md)。英文版是 [`docs/guide/version-check.md`](docs/guide/version-check.md)。

如果有依賴過時，請回報（見下面的 good first issue）。維護者會升級版本、同步 `bun.lock` / `flake.lock`、跑測試，然後合併。你不需要建置或測試任何東西。

---

## Good First Issues

這些適合第一次貢獻的人。需要的背景很少，成功條件清楚。最新的清單請看 [GitHub issues](https://github.com/eouzoe/good-techstack/issues)。

### 初學者

**回報過時的依賴（不需要寫程式）**

執行 `just check-versions`。如果它回報某個過時的 **DIRECT** 依賴，或你發現某個非 npm 套件有更新的釋出版本，請開一個 issue，說明是哪個套件、最新版本是多少、你查閱的連結。完整步驟與套件清單：[`docs/guide/version-check.zh.md`](docs/guide/version-check.zh.md)（英文：[`docs/guide/version-check.md`](docs/guide/version-check.md)）。升級與測試由維護者處理。

**版本一致性檢查器（改進現有腳本）**

腳本已經存在於 `scripts/check-versions.mjs`，可透過 `just check-versions` 執行。請改進它——例如加一個每週執行的 GitHub Action（`.github/workflows/version-check.yml`），跑完後若發現過時就自動開 issue。

**檔案：** `scripts/check-versions.mjs`, `.github/workflows/version-check.yml`

---

**在乾淨的機器上驗證 curl|sh**

準備一個乾淨的環境（全新的 WSL、VM 或 Docker），執行 curl|sh 指令，並記錄所有出錯或讓你困惑的地方。每個問題都開一個 issue。

**檔案：** 不需改程式碼。把發現回報成 GitHub issue。

---

### 中階

**GitHub Actions CI 流程**

改進 `.github/workflows/ci.yml`，讓它在每個 PR 上跑兩層關卡（第一層：lint → type-check → unit test → integration test；第二層：`devenv test`）。

**檔案：** `.github/workflows/ci.yml`

---

**Devenv 開發環境**

為不使用原生 Nix 的開發者記錄 `devenv` 工作流程。涵蓋 `devenv shell`、`devenv process up`、`just` 指令、git hooks。

**檔案：** `devenv.nix`、`Justfile`，更新 `docs/guide/development.md`

---

**用不同 AI 助手測試 bootstrap 流程**

用每個支援的助手（Claude Code、opencode、Codex、Cursor）測試 bootstrap 提示，記錄問題。

**檔案：** 不需改程式碼。回報發現。

---

## 較大的貢獻方向

有些貢獻橫跨整個技術堆疊，無法濃縮成單一 issue。這些記錄在 [`docs/guide/contribution-areas.md`](docs/guide/contribution-areas.md)。

**平台相容性：**

- **macOS**：在 Intel 與 Apple Silicon 上驗證並修好整個堆疊（start.sh、Bun、Nix、Wrangler、Playwright）
- **Windows**：測試原生 Windows 支援（Bun、Wrangler、Playwright），記錄 WSL1 與 WSL2 的差異
- **Linux 發行版**：在 Fedora、Arch、Alpine、NixOS 上測試，記錄發行版特有的問題

**持續維護：**

- 每月版本檢查：執行 `just check-versions`，再同步 `bun.lock` / `flake.lock` 並更新參考文件
- 將文件從英文翻譯成中文

**基礎建設：**

- 擴充 E2E 測試涵蓋範圍（註冊、登入、OAuth、CRUD、表單驗證）
- 用 fast-check 加入 property-based testing
- 編輯器設定指南（VS Code、Neovim、JetBrains）

開始任何這類工作之前，請先開 discussion 或 issue 協調。

## 有問題？

開 issue 或 discussion。我們會在幾天內回覆。
