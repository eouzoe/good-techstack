#!/bin/sh
# oxlint hook wrapper — routes the git-hooks oxlint through the repo-pinned
# linter (init-playground devDependency, reading the root configuration) so
# the hook never disagrees with `bunx oxlint`, instead of nixpkgs' older
# oxlint which cannot parse the current configuration.
#
# Skips with a warning when the playground dependencies are not installed
# (fresh clone), instead of falling back to a different oxlint version.
set -eu

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
oxlint="$root/init-playground/node_modules/.bin/oxlint"

if [ -x "$oxlint" ]; then
  exec "$oxlint" "$@"
fi

echo "oxlint-hook: init-playground/node_modules is not installed; skipping linting." >&2
echo "oxlint-hook: run 'cd init-playground && bun install' to enable it." >&2
exit 0
