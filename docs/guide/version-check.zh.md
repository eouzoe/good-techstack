# 版本檢查

本專案**不**維護手寫的版本清單。那種清單只要有人忘記更新就會過時，所有看到的人讀到的都是舊數字。相反地，**鎖定檔才是版本真相來源**，並用一個小腳本去比對發佈版本。

## 版本實際存在哪裡

| 項目                                                | 檔案                                             | 如何控管                           |
| --------------------------------------------------- | ------------------------------------------------ | ---------------------------------- |
| 每個 npm 依賴                                       | `bun.lock`                                       | 由 bun 解析；用 `bun update` 刷新  |
| 宣告的版本範圍                                      | `package.json`（root + `apps/*` + `packages/*`） | 手動編輯                           |
| devenv CLI                                          | `devenv.yaml`（`ref=v2.1.2`）                    | 改 git ref，再執行 `devenv update` |
| nixpkgs 工具（bun、node、oxlint、oxfmt、wrangler…） | `flake.lock`（nixpkgs commit）                   | 用 `nix flake update` 向前移動     |
| Nix daemon                                          | 單獨安裝                                         | 不在 repo 內追蹤                   |

## 如何檢查

執行比對腳本。它讀取 `bun.lock`，把每個**直接依賴**對照 npm 上的最新版本，並告訴你哪些過時：

```bash
just check-versions          # 或：bun scripts/check-versions.mjs
```

標記 `DIRECT` 的條目是我們有宣告、可以升級的依賴，那就是貢獻者要回報的。傳遞依賴由 bun 管理，除非某個直接依賴需要更新，否則不用管。

## 套件清單（不含版本）

這份清單**永遠不含版本號**，所以永遠不會過時。要看任一條目的最新版本，執行該列的命令即可。

每個 npm 套件的命令在 **Windows、macOS、Linux** 上完全相同（因為用的是 bun）：

```bash
bunx npm view <npm-name> version
```

| 套件                  | 角色     | npm 識別名（精確）                | 查最新版本                                              | 官方連結                                  |
| --------------------- | -------- | --------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| bun                   | 執行環境 | `bun`                             | `bunx npm view bun version`                             | https://bun.sh                            |
| TypeScript            | 語言     | `typescript`                      | `bunx npm view typescript version`                      | https://www.typescriptlang.org            |
| Hono                  | API      | `hono`                            | `bunx npm view hono version`                            | https://hono.dev                          |
| oRPC                  | API      | `@orpc/server`                    | `bunx npm view @orpc/server version`                    | https://orpc.dev                          |
| TanStack Start        | 前端     | `@tanstack/react-start`           | `bunx npm view @tanstack/react-start version`           | https://tanstack.com/start                |
| TanStack Router       | 前端     | `@tanstack/react-router`          | `bunx npm view @tanstack/react-router version`          | https://tanstack.com/router               |
| React                 | 前端     | `react`                           | `bunx npm view react version`                           | https://react.dev                         |
| better-auth           | 驗證     | `better-auth`                     | `bunx npm view better-auth version`                     | https://better-auth.com                   |
| Drizzle ORM           | ORM      | `drizzle-orm`                     | `bunx npm view drizzle-orm version`                     | https://orm.drizzle.team                  |
| Drizzle Kit           | ORM      | `drizzle-kit`                     | `bunx npm view drizzle-kit version`                     | https://orm.drizzle.team/kit              |
| Zod                   | 結構     | `zod`                             | `bunx npm view zod version`                             | https://zod.dev                           |
| oxlint                | 檢查     | `oxlint`                          | `bunx npm view oxlint version`                          | https://oxc.rs                            |
| oxfmt                 | 格式化   | `oxfmt`                           | `bunx npm view oxfmt version`                           | https://oxc.rs                            |
| Rsbuild               | 建置     | `@rsbuild/core`                   | `bunx npm view @rsbuild/core version`                   | https://rsbuild.rs                        |
| Rspack                | 建置     | `rspack`                          | `bunx npm view rspack version`                          | https://rspack.dev                        |
| Vitest                | 測試     | `vitest`                          | `bunx npm view vitest version`                          | https://vitest.dev                        |
| Vitest pool (workers) | 測試     | `@cloudflare/vitest-pool-workers` | `bunx npm view @cloudflare/vitest-pool-workers version` | https://developers.cloudflare.com/workers |
| Wrangler              | 部署     | `wrangler`                        | `bunx npm view wrangler version`                        | https://developers.cloudflare.com/workers |
| Cloudflare 型別       | 型別     | `@cloudflare/workers-types`       | `bunx npm view @cloudflare/workers-types version`       | https://developers.cloudflare.com/workers |

### npm 衛生

npm 的**套件名**不一定等於工具名。永遠使用上面精確的識別名，不要自己猜：

- `rsbuild`（CLI）來自 `@rsbuild/core`
- oRPC 發佈為 `@orpc/server`
- Drizzle ORM 是 `drizzle-orm`，不是 `drizzle`
- TanStack Start 是 `@tanstack/react-start`

## 非 npm 套件

這些不在 npm 上，所以腳本不檢查它們。請手動檢查。

| 套件       | 如何檢查（macOS / Linux）                                       | 如何檢查（Windows）    | 官方連結                                      |
| ---------- | --------------------------------------------------------------- | ---------------------- | --------------------------------------------- |
| Node.js    | `nvm ls-remote \| tail` 或 `nix eval nixpkgs#nodejs_22.version` | `nvm list available`   | https://nodejs.org/en/about/previous-releases |
| devenv     | `devenv --version`                                              | `devenv --version`     | https://github.com/cachix/devenv/releases     |
| Nix        | `nix --version`                                                 | `nix --version`        | https://github.com/NixOS/nix/releases         |
| SecretSpec | `secretspec --version`                                          | `secretspec --version` | https://secretspec.dev                        |
| just       | `just --version`                                                | `just --version`       | https://github.com/casey/just/releases        |

## 要回報什麼

如果 `just check-versions` 顯示某個過時的 **DIRECT** 依賴，或你發現某個非 npm 套件有更新的釋出版本，請開一個 issue（或一行 PR）說明：

- 哪個套件
- 你看到的最新版本
- 你查閱的連結

維護者會升級版本、同步 `bun.lock` / `flake.lock`、跑測試，然後合併。你不需要安裝、建置或測試任何東西。

完整流程請見 [issue #2](https://github.com/eouzoe/good-techstack/issues/2)。
