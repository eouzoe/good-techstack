{ pkgs, config, lib, ... }:

let
  arch = if pkgs.stdenv.hostPlatform.isAarch64 then "aarch64" else "x64";
  bun_1_3_14 = pkgs.runCommandNoCC "bun-1.3.14" {
    src = pkgs.fetchurl {
      url = "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-${arch}.zip";
      sha256 = if pkgs.stdenv.hostPlatform.isAarch64
        then "a27ffb63a8310375836e0d6f668ae17fa8d8d18b88c37c821c65331973a19a3b"
        else "951ee2aee855f08595aeec6225226a298d3fea83a3dcd6465c09cbccdf7e848f";
    };
    nativeBuildInputs = [ pkgs.unzip ];
  } ''
    unzip -j $src 'bun-linux-${arch}/bun' -d $out/bin
    chmod +x $out/bin/bun
  '';
in
{
  # No custom overlays — Bun is defined as a standalone package via
  # runCommandNoCC above (no gcc/python3/perl build deps).
  # Previously a stdenv.mkDerivation overlay conflicted with the js
  # module and polluted PATH in enterShell.

  languages.javascript.bun.enable = true;
  languages.javascript.bun.package = bun_1_3_14;
  languages.javascript.bun.install.enable = true;

  packages = with pkgs; [
    bun
    zsh
    just
    oxlint
    oxfmt
    wrangler
    prettier
    git curl jq
    nushell
  ];
  # Removed: nodejs_22            (js module → nodejs-slim)
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
    [ -d node_modules ] || bun install
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
