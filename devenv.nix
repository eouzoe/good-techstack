{ pkgs, config, lib, ... }:

let
  isAarch64 = pkgs.stdenv.hostPlatform.isAarch64;
in
{
  overlays = [
    (final: prev: {
      bun = prev.stdenv.mkDerivation {
        pname = "bun";
        version = "1.3.14";
        src = prev.fetchurl {
          url = "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-${if prev.stdenv.hostPlatform.isAarch64 then "aarch64" else "x64"}.zip";
          sha256 = if prev.stdenv.hostPlatform.isAarch64
            then "a27ffb63a8310375836e0d6f668ae17fa8d8d18b88c37c821c65331973a19a3b"
            else "951ee2aee855f08595aeec6225226a298d3fea83a3dcd6465c09cbccdf7e848f";
        };
        nativeBuildInputs = [ prev.unzip ];
        installPhase = ''
          mkdir -p $out/bin
          cp bun-linux-*/bun $out/bin/bun
          chmod +x $out/bin/bun
        '';
        meta.mainProgram = "bun";
      };
    })
  ];

  languages.javascript.bun.enable = true;
  languages.javascript.bun.install.enable = true;

  packages = with pkgs; [
    zsh
    just
    nodejs_22
    oxlint
    oxfmt
    wrangler
    typescript
    typescript-language-server
    prettier
    git curl jq
  ];

  # devenv's own binary cache — devenv handles the substituter + key.
  cachix.pull = [ "devenv" ];

  git-hooks.hooks = {
    oxlint.enable = true;
    oxfmt.enable = true;
    prettier.enable = true;
  };

  # secretspec.enable is read-only in devenv — it auto-activates (true)
  # when secretspec.toml secrets are loaded by the devenv CLI.
  # NEVER set it manually (read-only + conflicts with the module default).
  dotenv.enable = false;

  enterTest = ''
    bun install
    oxlint --type-aware
    tsc --noEmit
  '';

  scripts = {
    lint.exec = "oxlint --type-aware";
    typecheck.exec = "tsc --noEmit";
    test.exec = "bun test";
  };

  processes = {
    # long-running backend dev server; waits for D1 migrations to succeed
    backend = {
      exec = "bunx wrangler dev";
      cwd = "./apps/backend";
      after = [ "db:migrate@succeeded" ];
      ready.http.get = { port = 8787; path = "/"; };
    };
    # long-running frontend dev server; waits for backend to be ready
    frontend = {
      exec = "bunx rsbuild dev";
      cwd = "./apps/frontend";
      after = [ "devenv:processes:backend" ];
    };
  };

  # one-shot init: apply D1 migrations, then exit 0 (better-auth needs tables)
  tasks."db:migrate" = {
    exec = "bunx wrangler d1 migrations apply backend-db --local";
    cwd = "./apps/backend";
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
