# 查驗你自己的電腦環境（Linux）

`check-versions` 用來提醒維護者某個鎖定的依賴落後於上游。這個檢查則用來
告訴**你**：自己電腦上的工具是否與專案提供的版本一致——因為如果你用了更新
或不同的版本而壞掉，沒人需要為這個後果負責。專案保證這組鎖定的版本可正常
運作，而且由我們來維護。

## 如何執行

```bash
just check-env          # 或：bun scripts/check-env.mjs
```

僅限 Linux。下方的修正指令皆為 bash。

## 比對什麼

此腳本讀取專案自己的版本鎖定，再與你 `PATH` 上的版本比對：

| 來源                    | 工具                                               |
| ----------------------- | -------------------------------------------------- |
| `flake.lock`（nixpkgs） | bun、node、oxlint、oxfmt、wrangler、prettier、just |
| `devenv.yaml`           | devenv CLI（`ref=v2.1.2`）                         |
| `bun.lock`              | npm CLI，例如 drizzle-kit                          |

## 不一致表示「對齊」，而非「升級」

若發現版本不同，正確作法是使用專案鎖定的版本——通常只要進入 devenv
shell，它就會提供完全一致的版本組合：

```bash
devenv shell            # 提供完全一致的鎖定工具版本
# 若希望每次 cd 自動進入：
direnv allow
```

對於 `bun.lock` 中的 npm CLI（例如 `drizzle-kit`），請用以下指令同步：

```bash
bun install             # 從 bun.lock 拉取鎖定版本
```

請**不要**用 `npm i -g` 或下載最新版來「修正」不一致。請使用專案的版本；
這部分由我們維護。

## 為什麼與 `check-versions` 分開

- `check-versions` 把專案鎖定的依賴與**官方最新版**比對——這是給維護者的訊號
  （貢獻者回報有更新版本，由我們來升級）。
- `check-env` 把**你的電腦**與**專案鎖定版本**比對——這是給貢獻者的保障
  （請用我們的版本，而非會出問題的更新版本）。

請見 [version-check.zh.md](version-check.zh.md) 瞭解依賴新鮮度檢查。
