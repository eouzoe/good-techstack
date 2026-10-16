---
title: "環境對齊"
---


`devenv shell` 會自動提供鎖定的工具版本（bun、node、oxlint、oxfmt、
wrangler、just 等），不需手動檢查環境。

## 保持依賴更新

```bash
just update    # bun update + devenv update
```

這會同時更新 npm 套件（`bun update`）和 Nix 套件（`devenv update`）。
建議定期執行，或在久未進入專案後執行。

## 為何以前更複雜

舊版有 `check-env.mjs`（比對本地工具與鎖定檔）和 `check-versions.mjs`
（比對鎖定依賴與 npm 最新版），已移除，因為：

- `devenv shell` 已保證環境一致性
- `just update` 提供更簡潔的更新流程
- 追蹤 npm 最新版是維護者的工作，非日常操作
