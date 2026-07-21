# Devenv Optimization Guide

## Binary Caching (Cachix)

Pulling from binary caches is configured in `devenv.nix`:

```nix
cachix.pull = [ "devenv" "pre-commit-hooks" ];
```

- `devenv.cachix.org` — default, caches devenv-nixpkgs/rolling
- `pre-commit-hooks.cachix.org` — caches git-hooks.nix binaries

### Cachix Push (CI / maintainers)

To push binaries to a project cache, create `devenv.local.nix` (gitignored):

```nix
{ ... }: {
  cachix.push = "good-techstack";
}
```

Set `CACHIX_AUTH_TOKEN` in your CI environment or via SecretSpec:

```bash
secretspec secret set CACHIX_AUTH_TOKEN "cachix-..."
secretspec run -- devenv shell
```

## stdenvNoCC

```nix
stdenv = pkgs.stdenvNoCC;
```

This skips the C compiler toolchain (GCC/binutils/etc. — hundreds of MB).
Safe for JS/TS projects: native addons use the system compiler (Xcode/gcc).

## macOS

| Concern | Solution |
|---------|----------|
| Apple SDK | `apple.sdk` defaults to `pkgs.apple-sdk` on darwin — no action needed |
| Rosetta 2 x86 packages | `lib.optionals (pkgs.stdenv.isDarwin && pkgs.stdenv.isAarch64)` |
| Nix store | Determinate installer sets `auto-optimise-store = true` |
| Devenv eval cache | devenv 2.0 incremental per-attribute cache — no action needed |
