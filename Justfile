# good-techstack — 終端常用操作
# 與 devenv scripts 互補：devenv scripts 給 agent 用，Justfile 給人用

alias d := dev

# 啟動所有 dev server（backend + frontend）
dev:
    devenv process up

# 執行 oxlint
lint:
    oxlint --type-aware

# TypeScript 型別檢查
typecheck:
    tsc --noEmit

# 執行測試
test:
    bun test

# 部署到 Cloudflare Workers
deploy:
    wrangler deploy

# 進入開發環境
setup:
    devenv shell

# 一次性引導：啟動種子（start.sh）跑完後，環境已就緒
bootstrap:
    @command -v bun    >/dev/null 2>&1 && echo "  ✓ bun:      $(bun --version)"
    @command -v oxlint >/dev/null 2>&1 && echo "  ✓ oxlint:   $(oxlint --version)"
    @command -v just   >/dev/null 2>&1 && echo "  ✓ just:     $(just --version)"
    @echo "  → Next: set your secrets and start your AI agent (see README.md)."


# SecretSpec audit log
audit:
    secretspec audit

# 執行 formatter（oxfmt + prettier）
format:
    oxfmt --write .
    prettier --write --ignore-unknown .

# 清理建置產物
clean:
    rm -rf dist/ build/ .next/ out/ .wrangler/ node_modules/
    bun install

# 更新 nix flake lock
update:
    nix flake update
