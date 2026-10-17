{ pkgs, config, lib, ... }: {
  stdenv = pkgs.stdenvNoCC;

  languages.javascript.bun.enable = true;

  packages = with pkgs; [
    bun
    nodejs_26
    zsh
    just
    git jujutsu
    wrangler
    curl
    jaq
  ];

  cachix.pull = [ "devenv" ];

  git-hooks.hooks = {
    # Route the hook through the repo-pinned formatter (the init-playground
    # devDependency, aligned with vite-plus) instead of nixpkgs' oxfmt, so the
    # hook can never disagree with the committed formatting. Generated
    # `*.gen.ts` files are excluded.
    oxfmt = {
      enable = true;
      entry = "scripts/oxfmt-hook.sh";
      excludes = [ "\\.gen\\.ts$" ];
    };
    # Route the hook through the repo-pinned linter (the init-playground
    # devDependency) instead of nixpkgs' oxlint, which cannot parse the
    # current configuration; skips cleanly when the dependencies are absent.
    # docs/ is excluded: the Astro app is guarded by `docs:check` (astro
    # check), and oxlint over the Nimbus sources is pure noise.
    oxlint = {
      enable = true;
      entry = "scripts/oxlint-hook.sh";
      excludes = [ "^docs/" ];
    };
    # Architecture rules (dependency-cruiser) through the repo-pinned CLI, so
    # the hook reads the same graph as `just lint` and CI. Only staged
    # TypeScript under init-playground triggers it; the wrapper always cruises
    # the full src tree.
    depcruise = {
      enable = true;
      entry = "scripts/depcruise-hook.sh";
      files = "^init-playground/(src|scripts)/.*\\.(ts|tsx)$";
    };
  };

  dotenv.enable = false;

  enterTest = ''
    devenv tasks run --mode all deps:lint lint:arch lint:arch:self codegen:check typecheck:app typecheck:worker test:unit test:worker docs:check docs:build
  '';

  tasks."deps:lint" = {
    exec = "bunx oxlint --type-aware";
    after = [ "deps:install" ];
  };

  tasks."deps:install" = {
    exec = "bun install";
    execIfModified = [ "bun.lock" ];
    before = [ "devenv:enterShell" ];
  };

  tasks."deps:install-playground" = {
    exec = "cd init-playground && bun install --frozen-lockfile";
    execIfModified = [ "init-playground/bun.lock" ];
  };

  # Legacy `typecheck:backend` / `typecheck:frontend` names dated from the old
  # apps/{backend,frontend} split that the refresh consolidated into a single
  # init-playground project; the two real checks now are the app typecheck
  # and the worker-project (tests/worker) tsc pass.
  tasks."typecheck:app" = {
    exec = "cd init-playground && bun run typecheck";
    after = [ "deps:install-playground" ];
  };

  tasks."typecheck:worker" = {
    exec = "cd init-playground && node node_modules/typescript/bin/tsc --noEmit -p tests/worker/tsconfig.json";
    after = [ "deps:install-playground" ];
  };

  # Test gates — the Kernel suites that previously had no runner in the
  # pipeline: the node-env unit suite (vitest) and the Worker-boundary suite
  # (@cloudflare/vitest-plugin inside real workerd against D1). The worker
  # suite MUST run under Node (bun's ws breaks the plugin's WebSocket pool) —
  # mirroring init-playground/Justfile `test-unit` / `test-worker`.
  tasks."test:unit" = {
    exec = "cd init-playground && bun run test";
    after = [ "deps:install-playground" ];
  };

  tasks."test:worker" = {
    exec = "cd init-playground && node node_modules/vitest/vitest.mjs run --config vitest.worker.config.ts --no-file-parallelism";
    after = [ "deps:install-playground" ];
  };

  # Architecture gate (Phase E): dependency-cruiser layering rules, plus the
  # self-test that proves the gate still catches a synthetic violation.
  # The parser is swc — TypeScript 7 ships no compiler API for depcruise yet.
  tasks."lint:arch" = {
    exec = "cd init-playground && bunx depcruise src";
    # The self-test briefly injects a violation into src/, so it must finish
    # before the real cruise starts (tasks run in parallel by default).
    after = [ "deps:install-playground" "lint:arch:self" ];
  };

  tasks."lint:arch:self" = {
    exec = "cd init-playground && bun scripts/arch-selftest.ts";
    after = [ "deps:install-playground" ];
  };

  # Codegen drift gate: regenerating the routers must leave the tree untouched.
  tasks."codegen:check" = {
    exec = "cd init-playground && bun scripts/codegen-router.ts && git diff --exit-code -- src/routers";
    after = [ "deps:install-playground" ];
  };

  # Docs site (Nimbus, in docs/): install from the lockfile, run the
  # authoring checks (`nimbus-docs check` — frontmatter + internal links),
  # then a production build. Both are gated in CI.
  tasks."deps:install-docs" = {
    exec = "cd docs && bun install --frozen-lockfile";
  };

  tasks."docs:check" = {
    exec = "cd docs && bunx @cloudflare/nimbus-docs check";
    after = [ "deps:install-docs" ];
  };

  tasks."docs:build" = {
    exec = "cd docs && bun run build";
    after = [ "deps:install-docs" ];
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
    lint = {
      cmd = "devenv shell -- just lint";
      description = "Run oxlint + the architecture rules on the codebase";
    };
    typecheck = {
      cmd = "devenv shell -- just typecheck";
      description = "Run tsc --noEmit for TypeScript type checking";
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
    echo "└────────────────────────────────────┘"
    echo ""
    echo "  devenv tasks: lint, typecheck"
    echo ""
  '';
}
