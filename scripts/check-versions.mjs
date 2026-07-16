#!/usr/bin/env bun
// Compare every dependency the project directly controls against the latest
// version published on npm, and report what is outdated.
//
// WHY WE COMPARE "ALL" (every direct dependency, across every workspace):
//   bun.lock is the real source of truth for npm versions. If a direct
//   dependency drifts from the latest published version, we want to know so
//   the maintainers can bump it. Transitive dependencies are resolved and
//   refreshed by bun itself (`bun update`) — contributors do not act on those.
//
// WHAT THE CONTRIBUTOR ACTUALLY LOOKS AT:
//   The packages flagged "DIRECT" below. Those are the dependencies declared
//   in a package.json (root + apps/* + packages/*). Report an outdated one and
//   a maintainer will bump it, sync bun.lock, and run the tests.
//
// Run (any OS with bun):   bun scripts/check-versions.mjs
// Via just:                just check-versions
// Via devenv:              devenv shell -- just check-versions
//
// NOTE: non-npm packages (node, devenv, nix, secretspec) are not checked here.
// See docs/guide/version-check.md (or .zh.md) for how to check those.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();

// Collect every dependency declared in any package.json (direct dependencies).
function findPackageJson(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".devenv") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) findPackageJson(full, out);
    else if (entry.name === "package.json") out.push(full);
  }
  return out;
}

const directDeps = new Map();
for (const file of findPackageJson(root)) {
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  for (const section of ["dependencies", "devDependencies"]) {
    for (const [name, range] of Object.entries(pkg[section] ?? {})) {
      directDeps.set(name, range);
    }
  }
}

// bun.lock is JSON5 (trailing commas, possibly unquoted keys), so parse it with
// a tolerant regex instead of JSON.parse. Each packages entry looks like:
//   "name": ["name@version", "", {...}, "sha512..."]
const lockText = readFileSync(join(root, "bun.lock"), "utf8");
const resolved = new Map();
const entryRe = /"([^"]+)":\s*\[\s*"[^"]*@([^"]+)"/g;
let m;
while ((m = entryRe.exec(lockText)) !== null) {
  const name = m[1];
  const version = m[2];
  if (version.includes("workspace:")) continue; // local workspace, not a real version
  if (!resolved.has(name)) resolved.set(name, version);
}

function npmLatest(name) {
  for (const [cmd, args] of [
    ["bunx", ["npm", "view", name, "version"]],
    ["npm", ["view", name, "version"]],
  ]) {
    try {
      return execFileSync(cmd, args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      // try the next command
    }
  }
  return null;
}

console.log("Checking direct dependencies against npm...\n");
let outdated = 0;
for (const [name, range] of [...directDeps.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const locked = resolved.get(name) ?? "(absent from bun.lock)";
  const latest = npmLatest(name);
  if (!latest) {
    console.log(`?  ${name}  — could not query npm (declared ${range})`);
    continue;
  }
  if (locked !== latest) {
    outdated++;
    console.log(`OUTDATED  ${name}   [DIRECT — report this]`);
    console.log(`          locked : ${locked}`);
    console.log(`          latest : ${latest}`);
    console.log(`          check  : bunx npm view ${name} version`);
  }
}
console.log(
  outdated === 0
    ? "\nAll direct dependencies are up to date."
    : `\n${outdated} outdated direct dependenc(y/ies). Report them — a maintainer will bump and test.`,
);
