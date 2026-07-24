# Clean build artefacts
clean:
    rm -rf dist/ build/ .next/ out/ .wrangler/ node_modules/
    bun install

# Update devenv lock (devenv.lock: nixpkgs + devenv modules)
update:
    devenv update
