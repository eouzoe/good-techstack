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
    nodejs_22
    oxlint
    wrangler
    nodePackages.typescript
    nodePackages.typescript-language-server
    nodePackages.prettier
    git curl jq
  ];

  dotenv.enable = true;

  scripts = {
    lint.exec = "bunx oxlint";
    typecheck.exec = "bunx tsc --noEmit";
    test.exec = "bun test";
  };

  processes = {
    backend.exec = "bun run --cwd apps/backend dev";
    frontend.exec = "bun run --cwd apps/frontend dev";
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
