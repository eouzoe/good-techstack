{
  description = "good-techstack — edge fullstack dev environment (Bun owns JS deps, Nix owns the toolchain)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        isAarch64 = pkgs.stdenv.hostPlatform.isAarch64;

        bun_1_3_14 = pkgs.stdenv.mkDerivation {
          pname = "bun";
          version = "1.3.14";
          src = pkgs.fetchurl {
            url = "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-${if isAarch64 then "aarch64" else "x64"}.zip";
            sha256 = if isAarch64
              then "a27ffb63a8310375836e0d6f668ae17fa8d8d18b88c37c821c65331973a19a3b"
              else "951ee2aee855f08595aeec6225226a298d3fea83a3dcd6465c09cbccdf7e848f";
          };
          nativeBuildInputs = [ pkgs.unzip ];
          installPhase = ''
            mkdir -p $out/bin
            cp bun-linux-*/bun $out/bin/bun
            chmod +x $out/bin/bun
          '';
          meta.mainProgram = "bun";
        };

        toolchain = with pkgs; [
          bun_1_3_14
          nodejs_22
          oxlint
          oxfmt
          workerd
          wrangler
          nodePackages.typescript
          nodePackages.typescript-language-server
          nodePackages.prettier
          git curl jq
        ];

        shellHook = ''
          echo "┌─────────────────────────────────────┐"
          echo "│  good-techstack dev environment      │"
          echo "│  bun:      $(bun --version)                   │"
          echo "│  node:     $(node --version)                  │"
          echo "│  oxlint:   $(oxlint --version 2>/dev/null || echo 'N/A')                │"
          echo "│  workerd:  $(workerd --version 2>/dev/null || echo 'N/A')           │"
          echo "│  wrangler: $(wrangler --version 2>/dev/null || echo 'N/A') │"
          echo "└─────────────────────────────────────┘"
          if [ -f apps/backend/bun.lock ]; then
            echo "  ✓ JS deps ready (cd apps/backend && bun run dev)"
          else
            echo "  → Run: cd apps/backend && bun install"
          fi
          echo ""
        '';
      in
      {
        devShells.default = pkgs.mkShell {
          packages = toolchain;
          shellHook = shellHook;
        };

        devShells.ci = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            wrangler
            nodePackages.typescript
            git
          ];
          shellHook = '' echo "good-techstack CI shell (node + wrangler)"; '';
        };
      });
}
