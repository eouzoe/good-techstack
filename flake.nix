{
  description = "good-techstack — edge fullstack build outputs (dev environment managed by devenv.nix)";

  nixConfig = {
    extra-trusted-public-keys = "devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw=";
    extra-substituters = "https://devenv.cachix.org";
  };

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];

      perSystem = system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          bun = pkgs.bun;
          default = pkgs.bun;
        };

      packages = builtins.listToAttrs (map (s: { name = s; value = perSystem s; }) systems);
    in
    {
      inherit packages;
    };
}
