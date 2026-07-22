{ pkgs, config, lib, ... }: {
  # Speed: skip C compiler toolchain (unnecessary for JS/TS — saves hundreds MB
  # in eval + store). Native addons use system Xcode/gcc, not nix's stdenv.
  stdenv = pkgs.stdenvNoCC;

  languages.javascript.bun.enable = true;

  packages = with pkgs; [
    bun
    nodejs_26
    zsh
    just
    oxfmt
    git jujutsu
  ];
  # Removed: nodejs_22            (js module → nodejs-slim)
  #          typescript            (bunx tsc)
  #          typescript-language-server  (js LSP module)
  # Node is pinned to nodejs_26 via the packages list (the nodejs submodule does
  # not honour languages.javascript.package) so the runtime version is tracked
  # instead of arriving via a transitive dep.

  # Binary cache: devenv.cachix.org (default, includes all transitive deps incl.
  # git-hooks.nix binaries — no separate pre-commit-hooks cache needed).
  cachix.pull = [ "devenv" ];

  git-hooks.hooks = {
    oxfmt.enable = true;
  };

  dotenv.enable = false;

  # Secrets: auto-injected from secretspec (env vars in CI, keyring locally).
  # `or ""` keeps the shell functional even when secrets aren't configured yet.
  env = {
    CLOUDFLARE_ACCOUNT_ID = config.secretspec.secrets.CLOUDFLARE_ACCOUNT_ID or "";
    CLOUDFLARE_API_TOKEN = config.secretspec.secrets.CLOUDFLARE_API_TOKEN or "";
    DATABASE_URL = config.secretspec.secrets.DATABASE_URL or "";
    SESSION_SECRET = config.secretspec.secrets.SESSION_SECRET or "";
    BETTER_AUTH_SECRET = config.secretspec.secrets.BETTER_AUTH_SECRET or "";
    BETTER_AUTH_URL = config.secretspec.secrets.BETTER_AUTH_URL or "";
    PUBLIC_APP_URL = config.secretspec.secrets.PUBLIC_APP_URL or "";
  };

  enterTest = ''
    devenv tasks run --mode all \
      deps:lint typecheck:backend typecheck:frontend test:backend test:frontend
  '';

  tasks."deps:lint" = {
    exec = "bunx oxlint --type-aware";
    after = [ "deps:install" ];
  };

  tasks."deps:check-versions" = {
    exec = "bun scripts/check-versions.mjs";
    after = [ "deps:install" ];
  };

  tasks."deps:check-env" = {
    exec = "bun scripts/check-env.mjs";
    after = [ "deps:install" ];
  };

  tasks."deps:install" = {
    exec = "bun install";
    execIfModified = [ "bun.lock" ];
    before = [ "devenv:enterShell" ];
  };

  tasks."deps:gen-types" = {
    exec = "cd apps/backend && bunx wrangler types --env-interface CloudflareBindings";
    execIfModified = [ "apps/backend/src/**" "apps/backend/wrangler.toml" ];
    after = [ "deps:install" ];
  };

  tasks."typecheck:backend" = {
    exec = "cd apps/backend && bunx tsc --noEmit";
    after = [ "deps:gen-types" ];
  };

  tasks."typecheck:frontend" = {
    exec = "cd apps/frontend && bunx tsc --noEmit";
    after = [ "deps:install" ];
  };

  tasks."test:backend" = {
    exec = "cd apps/backend && bunx bun test --pass-with-no-tests";
    after = [ "deps:install" ];
  };

  tasks."test:frontend" = {
    exec = "cd apps/frontend && bunx rstest";
    after = [ "deps:install" ];
  };

  # One-shot init steps (D1 migration, seed, etc.) are wired here once the
  # business layer exists — see docs/agent/testing.md. They use
  # `processes.<name>.task` (devenv 2.x native) and attach via
  # `backend.after = [ "...@succeeded" ]`. Not 预设 before business确认.

  processes = {
    backend = {
      ports.http.allocate = 8787;
      exec = "bunx wrangler dev --port ${toString config.processes.backend.ports.http.value} --ip 127.0.0.1";
      cwd = "./apps/backend";
      after = [ "deps:install" "deps:gen-types" ];
    };
    frontend = {
      ports.web.allocate = 3000;
      exec = "bunx rsbuild dev --port ${toString config.processes.frontend.ports.web.value}";
      cwd = "./apps/frontend";
      after = [ "deps:install" "deps:gen-types" ];
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
    echo "┌────────────────────────────────────┐"
    echo "│  good-techstack dev environment     │"
    echo "│  bun:  $(bun --version)                    │"
    echo "│  node: $(node --version)                   │"
    echo "│  oxfmt: $(oxfmt --version 2>/dev/null || echo 'N/A') │"
    echo "└────────────────────────────────────┘"
    echo ""
    echo "  devenv tasks: lint, typecheck, test"
    echo "  devenv processes: backend, frontend"
    echo ""
  '';
}
