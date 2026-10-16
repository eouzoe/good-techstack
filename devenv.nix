{ pkgs, config, lib, ... }: {
  stdenv = pkgs.stdenvNoCC;

  languages.javascript.bun.enable = true;

  packages = with pkgs; [
    bun
    nodejs_26
    zsh
    just
    oxfmt
    git jujutsu
    wrangler
    curl
    jaq
  ];

  cachix.pull = [ "devenv" ];

  git-hooks.hooks = {
    oxfmt.enable = true;
    oxlint.enable = true;
  };

  dotenv.enable = false;

  enterTest = ''
    devenv tasks run --mode all deps:lint docs:check docs:build
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
      description = "Run oxlint on the codebase";
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
    echo "│  oxfmt: $(oxfmt --version 2>/dev/null || echo 'N/A') │"
    echo "└────────────────────────────────────┘"
    echo ""
    echo "  devenv tasks: lint, typecheck"
    echo ""
  '';
}
