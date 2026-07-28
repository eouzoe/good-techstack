# gstack init-playground — 打包優化流程

## 現狀診斷 → 優化後成果

| 指標        | 優化前 | 優化後      | 改善     |
| ----------- | ------ | ----------- | -------- |
| dist/server | 2.8 MB | **0.39 MB** | **-86%** |
| dist/client | 2.2 MB | **0.32 MB** | **-85%** |
| Gzip client | -      | **101 KB**  | -        |
| Total       | 5.0 MB | **0.71 MB** | **-86%** |

Root cause: `ssr` 環境 `minify: false`（`output.target: 'node'` 預設行為），
未設 `dataUriLimit: 0`、`resolve.dedupe`、`removeConsole`。

Root fix: Rsbuild `environments.ssr.output.target: 'web-worker'` + `minify: true` +
`dataUriLimit: 0` + `removeConsole: true` + `resolve.dedupe`。

---

## 架構原則

| 問題                    | 答案                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Hono 要拆嗎？           | **不拆**。單一 Worker，Hono + TanStack Start SSR 共用同一 fetch handler。                                   |
| Rsbuild environments？  | **用**，但底層仍走 Rspack MultiCompiler，ukan plugin 管理。                                                 |
| Polyfill / Browserslist | Cloudflare Workers 是 V8 現代環境，`browserslist` 設為 `>0.3%` 現代瀏覽器即可。                             |
| 資源內嵌                | **禁止**。`dataUriLimit: 0`，所有靜態資源走 `dist/client/assets/`（CF Pages 免費託管）。                    |
| Server minify           | **強制開啟**。`target: 'web-worker'` 或手動 `minify: true`。                                                |
| Console / dead code     | **物理刪除**。`performance.removeConsole: true`（單側），`define` 設 `process.env.NODE_ENV: 'production'`。 |

---

## 優化後 `rsbuild.config.ts`

見 `rsbuild.config.ts`（已更新）。

---

## 優化手段對照表

| #   | 手段                       | 對應配置                                                              | 效果                      |
| --- | -------------------------- | --------------------------------------------------------------------- | ------------------------- |
| 1   | 拔掉 Polyfill              | `output.polyfill: 'off'`                                              | 移除 core-js 墊片         |
| 2   | Server 極限壓縮            | `environments.ssr.output.minify: true` + `target: 'web-worker'`       | 2.8MB → 0.39MB            |
| 3   | Bun / 依賴去重             | `resolve.dedupe: ['tslib', 'valibot', '@tanstack/react-router', ...]` | 避免重复打包              |
| 4   | Browserslist               | `package.json` `browserslist: ["> 0.3%", "not ie 11", "not dead"]`    | 降級語法消失              |
| 5   | 移除 console               | `performance.removeConsole: true`（client + server 都要）             | AST 物理刪除              |
| 6   | SWC 進攻型壓縮             | `tools.swc.jsc.minify.compress: { passes: 3, deadCode: true }`        | Rspack/SWC 極致壓縮       |
| 7   | 禁止資源內嵌               | `output.dataUriLimit: 0`                                              | Assets 不進 Worker bundle |
| 8   | 避免 Node 產物             | `environments.ssr.output.target: 'web-worker'` + `minify: true`       | 符合 CF Workers runtime   |
| 9   | KV 存 Manifest             | 手動拆 `manifest.json` + `c.env.KV.get()`                             | Worker bundle 乾淨        |
| 10  | Rsbuild 內建 removeConsole | 見 #5                                                                 | -                         |
| 11  | Valibot tree-shaking       | `babel-plugin-valibot`（若需要）或精確 import                         | 避免全庫進 bundle         |

---

## 部署流程

```
source ──► rsbuild build ──► dist/client (assets, ~106KB gzip)
                              │
                              └─► dist/server (worker bundle ~0.39MB minified)

wrangler deploy:
  main: dist/server/index.js
  assets: dist/client (自動掛載)

驗證: dist/server = 391KB  < 1MB 免費額度 ✅
```

替代方案（推薦）：`alchemy deploy`（`src/infra/infrastructure.ts` 已定義完整資源）。

---

## 驗證指令

```bash
cd ~/src/active/gstack/init-playground

# 查看 bundle 大小
du -sh dist/server dist/client

# 查看是否有重複依賴（應只有單一版本）
bun pm ls tslib

# 部署（dry-run）
bunx wrangler deploy --dry-run

# 或使用 Alchemy
bun alchemy deploy
```
