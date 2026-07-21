# good-techstack — 終端常用操作
# 與 devenv scripts 互補：devenv scripts 給 agent 用，Justfile 給人用

alias d := dev

# 啟動所有 dev server（backend + frontend）
dev:
    devenv processes up

# 執行 oxlint
lint:
    bunx oxlint --type-aware

# TypeScript 型別檢查（根目錄無 tsconfig，逐 workspace 檢查）
typecheck:
    for d in apps/backend apps/frontend packages/shared; do tsc --noEmit -p "$d" || exit 1; done

# 執行測試（bun test — 後端單元 + shared package）
test:
    bun test

# 前端測試（rstest — 透過 Rsbuild 構建管線模擬部屬）
test-frontend:
    cd apps/frontend && bunx rstest

# 全部測試
test-all:
    devenv test

# 部署到 Cloudflare Workers
deploy:
    wrangler deploy

# 進入開發環境
setup:
    devenv shell

# 一次性引導：啟動種子（start.sh）跑完後，環境已就緒
bootstrap:
    @command -v bun    >/dev/null 2>&1 && echo "  ✓ bun:      $(bun --version)"
    @bunx oxlint --version >/dev/null 2>&1 && echo "  ✓ oxlint:   $(bunx oxlint --version)"
    @command -v just   >/dev/null 2>&1 && echo "  ✓ just:     $(just --version)"
    @echo "  → Next: set your secrets and start your AI agent (see README.md)."


# SecretSpec audit log
audit:
    secretspec audit

# 執行 formatter
format:
    oxfmt --write .

# 清理建置產物
clean:
    rm -rf dist/ build/ .next/ out/ .wrangler/ node_modules/
    bun install

# 更新 devenv 鎖定（devenv.lock：nixpkgs 與 devenv 模組）
update:
    devenv update

# 比對直接依賴與 npm 最新版本（詳見 docs/guide/version-check）
check-versions:
    bun scripts/check-versions.mjs

# 查驗本機工具鏈是否與專案鎖定版本一致（詳見 docs/guide/env-check，限 Linux）
check-env:
    bun scripts/check-env.mjs

# 用 bootstrap 提示詞以無互動模式啟動 AI agent
# 自動偵測 claude / codex / opencode（任一皆可），皆無則裝 OpenCode 後啟動
# 不鎖模型：opencode 走預設 provider（anthropic/claude-opus-4-6）
agent:
    #!/usr/bin/env bash
    prompt="$(cat docs/agent/bootstrap-prompt.md)"
    export PATH="$PATH:$HOME/.claude/bin:$HOME/.local/bin:$(npm bin -g 2>/dev/null):$(pnpm bin -g 2>/dev/null):$HOME/.bun/bin:$HOME/.local/share/mise/shims:$HOME/.nix-profile/bin:/nix/profile/bin:/nix/var/nix/profiles/default/bin:/usr/local/bin:/opt/homebrew/bin:$HOME/.cargo/bin"
    if   command -v claude      >/dev/null 2>&1; then agent=claude
    elif command -v claude-code  >/dev/null 2>&1; then agent=claude
    elif command -v codex        >/dev/null 2>&1; then agent=codex
    elif command -v codex-cli    >/dev/null 2>&1; then agent=codex
    elif command -v opencode     >/dev/null 2>&1; then agent=opencode
    else
        agent=opencode
        echo "  -> 找不到 AI agent，正在安裝 OpenCode ..."
        nix profile add nixpkgs#opencode
    fi
    echo "  -> 正在用 bootstrap 提示詞以無互動模式啟動 $agent ..."
    case "$agent" in
        claude)   claude -p "$prompt" ;;
        codex)    codex exec --full-auto "$prompt" ;;
        opencode) opencode run "$prompt" --auto ;;
    esac
