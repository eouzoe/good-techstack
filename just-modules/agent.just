# Start the AI agent non-interactively with the bootstrap prompt
agent:
    #!/usr/bin/env bash
    prompt="$(cat docs/en/agent/bootstrap-prompt.md)"
    export PATH="$PATH:$HOME/.claude/bin:$HOME/.local/bin:$(npm bin -g 2>/dev/null):$(pnpm bin -g 2>/dev/null):$HOME/.bun/bin:$HOME/.local/share/mise/shims:$HOME/.nix-profile/bin:/nix/profile/bin:/nix/var/nix/profiles/default/bin:/usr/local/bin:/opt/homebrew/bin:$HOME/.cargo/bin"
    if   command -v claude      >/dev/null 2>&1; then agent=claude
    elif command -v claude-code  >/dev/null 2>&1; then agent=claude
    elif command -v codex        >/dev/null 2>&1; then agent=codex
    elif command -v codex-cli    >/dev/null 2>&1; then agent=codex
    elif command -v opencode     >/dev/null 2>&1; then agent=opencode
    else
        agent=opencode
        echo "  -> Could not find any AI agent, installing opencode ..."
        nix profile add nixpkgs#opencode
    fi
    echo "  -> Starting $agent non-interactively with the bootstrap prompt ..."
    case "$agent" in
        claude)   claude -p "$prompt" ;;
        codex)    codex exec --full-auto "$prompt" ;;
        opencode) opencode run "$prompt" --auto ;;
    esac
