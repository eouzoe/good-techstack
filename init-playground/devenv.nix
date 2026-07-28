{ pkgs, config, lib, ... }: {
  stdenv = pkgs.stdenvNoCC;

  languages.javascript.bun.enable = true;

  packages = with pkgs; [
    betterleaks
    brotli
    bun
    curl
    drill
    hyperfine
    inferno
    jaq
    jujutsu
    just
    nodejs_26
    oha
    oxfmt
    wrangler
    zstd
    (pkgs.stdenv.mkDerivation {
      pname = "vite-plus-cli";
      version = "0.2.7";

      src = pkgs.fetchurl {
        url = "https://registry.npmjs.org/@voidzero-dev/vite-plus-cli-linux-x64-gnu/-/vite-plus-cli-linux-x64-gnu-0.2.7.tgz";
        sha256 = "sha256-s+5KiIlQ8HL23K3h82gFCAZgQbAO01Av+nftcASZdz4=";
      };

      dontUnpack = true;

      installPhase = ''
        mkdir -p $out/bin
        tar xzf $src --strip-components=1
        cp vp $out/bin/
        chmod +x $out/bin/vp
      '';

      meta = with lib; {
        description = "Vite+ unified toolchain CLI";
        homepage = "https://viteplus.dev";
        license = licenses.mit;
      };
    })
  ];

  cachix.pull = [ "devenv" ];

  git-hooks.enable = false;

  dotenv.enable = false;

  processes = {
    router-watcher = {
      exec = "bun --watch scripts/codegen-router.ts";
    };

    dev = {
      exec = "node node_modules/vite/bin/vite.js dev";
      after = [ "devenv:processes:router-watcher@started" ];
      ready.http.get = {
        port = 5173;
        path = "/";
      };
    };

    studio = {
      exec = "bunx drizzle-kit studio --config=drizzle.config.ts";
      after = [ "devenv:processes:dev@started" ];
      ready.http.get = {
        port = 4983;
        path = "/";
      };
    };
  };

  tasks = {
    "secrets:check" = {
      exec = "secretspec check";
      description = "Resolve SecretSpec secrets; generates BETTER_AUTH_SECRET when missing";
      before = [ "devenv:enterShell" ];
    };

    "deps:install" = {
      exec = "bun install";
      execIfModified = [ "bun.lock" ];
      before = [ "devenv:enterShell" ];
    };

    "codegen:router" = {
      exec = "bun scripts/codegen-router.ts";
      description = "Regenerate oRPC router from procedure files";
    };

    "db:generate" = {
      exec = "bunx drizzle-kit generate";
      execIfModified = [ "src/server/db/schema.ts" ];
    };

    "db:migrate" = {
      exec = "bunx wrangler d1 migrations apply gstack";
      after = [ "db:generate" ];
    };

    "db:seed" = {
      exec = "bun run cli/seed.ts";
      after = [ "db:migrate" ];
      description = "Seed the database with initial data (Brocli)";
    };

    "test:setup" = {
      exec = "echo 'test setup complete'";
      before = [ "devenv:enterTest" ];
    };
  };

  enterShell = ''
    echo "gstack"
    echo "  bun: $(bun --version)"
    echo "  run:  just dev"
    echo "  test: just test"
    echo "  seed: just seed"
  '';
}
