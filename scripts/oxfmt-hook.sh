#!/bin/sh
# oxfmt hook wrapper — routes the git-hooks oxfmt through the repo-pinned
# formatter (init-playground devDependency, aligned with vite-plus) so the
# hook never disagrees with the committed formatting.
#
# Skips with a warning when the playground dependencies are not installed
# (fresh clone), instead of falling back to a different oxfmt version.
set -eu

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
oxfmt="$root/init-playground/node_modules/.bin/oxfmt"

if [ -x "$oxfmt" ]; then
  exec "$oxfmt" "$@"
fi

echo "oxfmt-hook: init-playground/node_modules is not installed; skipping formatting." >&2
echo "oxfmt-hook: run 'cd init-playground && bun install' to enable it." >&2
exit 0
