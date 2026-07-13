{ pkgs, config, lib, ... }:

{
  # No custom overlays — Bun is provided by the native module below.
  # Previously: a manual stdenv.mkDerivation overlay that conflicted
  # with languages.javascript.bun.enable, broke bun PATH in enterShell,
  # and forced Nix to evaluate 2172 files + download build deps (gcc,
  # python3, perl) unnecessarily.

  languages.javascript.bun.enable = true;
  languages.javascript.bun.install.enable = true;
  # languages.javascript.bun.package defaults to pkgs.bun from
  # nixpkgs-unstable (currently 1.3.13).  Bump nixpkgs input in
  # devenv.yaml instead of adding an overlay.

  packages = with pkgs; [
    zsh
    just
    oxlint
    oxfmt
    wrangler
    prettier
    git curl jq
    nushell
  ];
  # Removed: nodejs_22            (handled by js module → nodejs-slim)
  #          typescript            (bunx tsc)
  #          typescript-language-server  (js LSP module)

  cachix.pull = [ "devenv" ];

  git-hooks.hooks = {
    oxlint.enable = true;
    oxfmt.enable = true;
    prettier.enable = true;
  };

  dotenv.enable = false;

  enterTest = ''
    bun install
    (cd apps/backend && bunx wrangler types)
    oxlint --type-aware
    bunx tsc -p apps/backend --noEmit
  '';

  scripts = {
    "generate-types".exec = "cd apps/backend && bunx wrangler types";
    lint.exec = "oxlint --type-aware";
    typecheck.exec = "cd apps/backend && bunx wrangler types && bunx tsc --noEmit";
    test.exec = "bun test";
  };

  processes = {
    backend = {
      exec = "bunx wrangler dev";
      cwd = "./apps/backend";
    };
    frontend = {
      exec = "bunx rsbuild dev";
      cwd = "./apps/frontend";
    };
  };

  claude.code.mcpServers = {
    devenv = {
      type = "stdio";
      command = "devenv";
      args = [ "mcp" ];
      env = {
        DEVENV_ROOT = config.devenv.root;
      };
    };
  };

  claude.code.commands = {
    dev = {
      cmd = "devenv shell -- just dev";
      description = "Start all development servers";
    };
    lint = {
      cmd = "devenv shell -- just lint";
      description = "Run oxlint on the codebase";
    };
    typecheck = {
      cmd = "devenv shell -- just typecheck";
      description = "Run TypeScript type checking";
    };
    test = {
      cmd = "devenv shell -- just test";
      description = "Run the test suite";
    };
  };

  claude.code.agents = {
    infra = {
      description = "Infrastructure and deployment specialist";
      mcpServers = [
        "cloudflare-api"
        "cloudflare-bindings"
        "cloudflare-observability"
      ];
    };
  };

  claude.code.hooks = {
    preRead = ''
      echo "[devenv hook] Reading config from $DEVENV_ROOT"
    '';
    preCommand = ''
      echo "[devenv hook] Running inside devenv environment"
    '';
  };
  enterShell = ''
    echo "┌─────────────────────────────────────┐"
    echo "│  good-techstack dev environment      │"
    echo "│  bun:      $(bun --version)                   │"
    echo "│  node:     $(node --version)                  │"
    echo "│  oxlint:   $(oxlint --version 2>/dev/null || echo 'N/A')                │"
    echo "│  wrangler: $(wrangler --version 2>/dev/null || echo 'N/A') │"
    echo "└─────────────────────────────────────┘"
    echo ""
    echo "  devenv scripts: lint, typecheck, test"
    echo "  devenv processes: backend, frontend"
    echo "  devenv mcp: AI agent integration"
    echo ""
  '';
}
