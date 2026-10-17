#!/bin/sh
# depcruise hook wrapper — routes the git-hooks architecture check through the
# repo-pinned dependency-cruiser (init-playground devDependency) so the
# pre-commit hook, `just lint` and CI all read the same module graph.
#
# The hook always cruises the whole `src` tree (the graph is cheap to build
# and a partial cruise would give partial answers). Skips with a warning when
# the playground dependencies are not installed (fresh clone).
set -eu

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$root/init-playground"

if [ -x node_modules/.bin/depcruise ]; then
  exec node node_modules/dependency-cruiser/bin/dependency-cruiser.mjs src
fi

echo "depcruise-hook: init-playground/node_modules is not installed; skipping architecture check." >&2
echo "depcruise-hook: run 'cd init-playground && bun install' to enable it." >&2
exit 0
