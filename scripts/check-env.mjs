#!/usr/bin/env bun
// Verify that the tools installed on THIS machine match the versions the
// Project actually provides — NOT the latest published upstream versions.
//
// WHY THIS IS DIFFERENT FROM check-versions.mjs
//   Check-versions.mjs asks "is our pinned version behind the official latest?"
//   That question is for MAINTAINERS: if a contributor sees a newer release, they
//   Report it and WE decide and apply the bump.
//   This script asks the opposite question: "is the contributor running a NEWER
//   Or different version than the project pins?" If they are, and something
//   Breaks, nobody is responsible. The project promises the pinned versions
//   Work; we maintain those, not whatever is newest on npm/GitHub today.
//
//   So when a tool mismatches, the fix is to ALIGN TO THE PROJECT VERSION — most
//   Often by entering the devenv shell, which provides exactly the pinned set.
//   Do not `npm i -g` / download the newest release to "fix" a mismatch.
//
// Run (Linux):   bun scripts/check-env.mjs
// Via just:      just check-env
// Via devenv:    devenv shell -- just check-env
//
// Linux only — the fix commands below are bash.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();

function sh(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      ...opts,
    }).trim();
  } catch {
    return null;
  }
}

// --- expected versions from the project's own pins -------------------------

// Devenv pins its own CLI version in devenv.yaml (ref=vX.Y.Z)
function devenvPinned() {
  const text = readFileSync(join(root, "devenv.yaml"), "utf8");
  const m = /ref=v([0-9]+\.[0-9]+\.[0-9]+)/.exec(text);
  return m ? m[1] : null;
}

// Bun.lock is JSON5; pull the resolved version of an npm package.
function bunLockVersion(name) {
  const text = readFileSync(join(root, "bun.lock"), "utf8");
  const re = new RegExp(
    `"${name.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}":\\s*\\[\\s*"[^"]*@([^"]+)"`,
  );
  const m = re.exec(text);
  return m ? m[1] : null;
}

// Nixpkgs tool version. We evaluate the EXACT revision pinned in devenv.lock
// (not the floating `nixpkgs` channel), so this matches what `devenv shell`
// Actually provides and works offline once that revision is in the store.
//
// Devenv.lock is a flake-lock-format JSON with MANY nixpkgs nodes (each pulled
// In by a different dependency). Only the one reachable from
// Nodes.root.inputs.nixpkgs is the toolchain nixpkgs — follow that pointer
// Rather than grabbing the first "nixpkgs" match, which would be wrong.
function nixpkgsRev() {
  const lock = JSON.parse(readFileSync(join(root, "devenv.lock"), "utf8"));
  const nodeName = lock?.nodes?.root?.inputs?.nixpkgs;
  if (!nodeName) {return null;}
  return lock?.nodes?.[nodeName]?.locked?.rev ?? null;
}
function nixpkgsVersion(attr) {
  const rev = nixpkgsRev();
  if (!rev) {return null;}
  return sh("nix", ["eval", `github:NixOS/nixpkgs/${rev}#${attr}.version`, "--raw"], {
    timeout: 20_000,
  });
}

// --- local version on this machine -----------------------------------------

function localVersion(name, flag = "--version") {
  const out = sh(name, [flag]);
  if (!out) {return null;}
  const m = /v?(\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?)/.exec(out);
  return m ? m[1] : null;
}

function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(v));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
function cmp(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) {return null;}
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) {return pa[i] < pb[i] ? -1 : 1;}
  }
  return 0;
}

// --- tool table -------------------------------------------------------------

const tools = [
  { fix: "devenv-shell", name: "bun", nix: "bun" },
  { fix: "devenv-shell", name: "just", nix: "just" },
  { fix: "devenv-shell", name: "oxfmt", nix: "oxfmt" },
  { bun: "oxlint", fix: "bun-install", name: "oxlint" },
  { bun: "wrangler", fix: "bun-install", name: "wrangler" },
  { fix: "devenv-shell", name: "node", nix: "nodejs_26", optional: true },
  { bun: "drizzle-kit", fix: "bun-install", name: "drizzle-kit" },
  { devenv: true, fix: "devenv-bin", name: "devenv" },
];

console.log("Checking your local toolchain against the project-pinned versions...\n");
console.log("(These are the versions THIS project provides — not the latest upstream.)\n");

let mismatches = 0;
for (const t of tools) {
  const local = localVersion(t.name);
  let expected = null;
  if (t.nix) {expected = nixpkgsVersion(t.nix);}
  else if (t.bun) {expected = bunLockVersion(t.bun);}
  else if (t.devenv) {expected = devenvPinned();}

  if (local == null) {
    console.log(`?  ${t.name}  — not found on PATH (run \`devenv shell\` to get it)`);
    continue;
  }
  if (expected == null) {
    console.log(
      `?  ${t.name}  — local ${local} (could not resolve project version; run \`devenv shell\`)`,
    );
    continue;
  }
  const c = cmp(local, expected);
  if (c === 0) {
    console.log(`OK        ${t.name}  ${local}  (matches project)`);
  } else {
    mismatches++;
    const newer = c > 0 ? "NEWER than project" : "OLDER than project";
    console.log(`MISMATCH  ${t.name}  local ${local} is ${newer} (project provides ${expected})`);
    console.log(`          fix: ${fixCommand(t, expected)}`);
  }
}

if (mismatches === 0) {
  console.log("\nAll checked tools match the project-pinned versions. You are set.");
} else {
  console.log(
    `\n${mismatches} tool(s) do not match the project. Use the project's pinned version` +
      ` (\`devenv shell\`), not the newest release from upstream — the project guarantees` +
      ` the pinned set works, and we maintain it.`,
  );
}

function fixCommand(t, expected) {
  switch (t.fix) {
    case "devenv-shell": {
      return "devenv shell   # (or: direnv allow — then the shell auto-enters with the pinned versions)";
    }
    case "bun-install": {
      return `bun install   # syncs ${t.name} to ${expected} from bun.lock`;
    }
    case "devenv-bin": {
      return `install devenv v${expected} exactly — see https://github.com/cachix/devenv/releases/tag/v${expected}`;
    }
    default: {
      return `align ${t.name} to ${expected}`;
    }
  }
}
