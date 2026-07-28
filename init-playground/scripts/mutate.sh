#!/usr/bin/env bash
# F+1 §46.11-A: institutionalized mutation. Runs every scoped Stryker config
# against the boundary it guards, then fails if any config does not meet its
# own thresholds (each config carries break/low/high).
#
# Usage: scripts/mutate.sh [scope]
#   scope = config basename minus extension: kernel | phase-d | phase-d-schema |
#           phase-d-adapter | phase-f | all (default)
set -euo pipefail

scope="${1:-all}"

if [ "$scope" = "all" ]; then
  cfgs=(stryker.config.json stryker.phase-d.json stryker.phase-d-schema.json stryker.phase-d-adapter.json stryker.phase-f.json)
else
  cfg="stryker.${scope}.json"
  [ -f "$cfg" ] || { echo "no $cfg" >&2; exit 1; }
  cfgs=("$cfg")
fi

for c in "${cfgs[@]}"; do
  echo "── mutate: $c"
  node node_modules/@stryker-mutator/core/bin/stryker.js run "$c"
done

echo "✓ mutation institutionalized: all scopes green"
