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
    jq
  ];

  cachix.pull = [ "devenv" ];

  git-hooks.hooks = {
    oxfmt.enable = true;
    oxlint.enable = true;
  };

  dotenv.enable = false;

  env = {
    CLOUDFLARE_ACCOUNT_ID = config.secretspec.secrets.CLOUDFLARE_ACCOUNT_ID or "";
    CLOUDFLARE_API_TOKEN = config.secretspec.secrets.CLOUDFLARE_API_TOKEN or "";
  };

  enterTest = ''
    devenv tasks run --mode all deps:lint
  '';

  tasks."deps:lint" = {
    exec = "bunx oxlint";
    after = [ "deps:install" ];
  };

  tasks."deps:install" = {
    exec = "bun install";
    execIfModified = [ "bun.lock" ];
    before = [ "devenv:enterShell" ];
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
      cmd = "devenv shell -- just lint";
      description = "Run oxlint (includes type checking via typeCheck config)";
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
