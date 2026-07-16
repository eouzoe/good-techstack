#!/usr/bin/env bun
// Verify that the tools installed on THIS machine match the versions the
// project actually provides — NOT the latest published upstream versions.
//
// WHY THIS IS DIFFERENT FROM check-versions.mjs
//   check-versions.mjs asks "is our pinned version behind the official latest?"
//   That question is for MAINTAINERS: if a contributor sees a newer release, they
//   report it and WE decide and apply the bump.
//   This script asks the opposite question: "is the contributor running a NEWER
//   or different version than the project pins?" If they are, and something
//   breaks, nobody is responsible. The project promises the pinned versions
//   work; we maintain those, not whatever is newest on npm/GitHub today.
//
//   So when a tool mismatches, the fix is to ALIGN TO THE PROJECT VERSION — most
//   often by entering the devenv shell, which provides exactly the pinned set.
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

// devenv pins its own CLI version in devenv.yaml (ref=vX.Y.Z)
function devenvPinned() {
  const text = readFileSync(join(root, "devenv.yaml"), "utf8");
  const m = text.match(/ref=v([0-9]+\.[0-9]+\.[0-9]+)/);
  return m ? m[1] : null;
}

// bun.lock is JSON5; pull the resolved version of an npm package.
function bunLockVersion(name) {
  const text = readFileSync(join(root, "bun.lock"), "utf8");
  const re = new RegExp(
    `"${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":\\s*\\[\\s*"[^"]*@([^"]+)"`,
  );
  const m = re.exec(text);
  return m ? m[1] : null;
}

// nixpkgs tool version. We evaluate the EXACT revision pinned in flake.lock
// (not the floating `nixpkgs` channel), so this matches what `devenv shell`
// actually provides and works offline once that revision is in the store.
function nixpkgsRev() {
  const text = readFileSync(join(root, "flake.lock"), "utf8");
  const m = text.match(/"nixpkgs":\s*\{[^}]*"rev":\s*"([0-9a-f]+)"/);
  return m ? m[1] : null;
}
function nixpkgsVersion(attr) {
  const rev = nixpkgsRev();
  if (!rev) return null;
  return sh("nix", ["eval", `github:NixOS/nixpkgs/${rev}#${attr}.version`, "--raw"], {
    timeout: 20000,
  });
}

// --- local version on this machine -----------------------------------------

function localVersion(name, flag = "--version") {
  const out = sh(name, [flag]);
  if (!out) return null;
  const m = out.match(/v?(\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?)/);
  return m ? m[1] : null;
}

function parseSemver(v) {
  const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
function cmp(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

// --- tool table -------------------------------------------------------------

const tools = [
  { name: "bun", nix: "bun", fix: "devenv-shell" },
  { name: "just", nix: "just", fix: "devenv-shell" },
  { name: "oxlint", nix: "oxlint", fix: "devenv-shell" },
  { name: "oxfmt", nix: "oxfmt", fix: "devenv-shell" },
  { name: "wrangler", nix: "wrangler", fix: "devenv-shell" },
  { name: "prettier", nix: "prettier", fix: "devenv-shell" },
  { name: "node", nix: "nodejs_22", fix: "devenv-shell", optional: true },
  { name: "drizzle-kit", bun: "drizzle-kit", fix: "bun-install" },
  { name: "devenv", devenv: true, fix: "devenv-bin" },
];

console.log("Checking your local toolchain against the project-pinned versions...\n");
console.log("(These are the versions THIS project provides — not the latest upstream.)\n");

let mismatches = 0;
for (const t of tools) {
  const local = localVersion(t.name);
  let expected = null;
  if (t.nix) expected = nixpkgsVersion(t.nix);
  else if (t.bun) expected = bunLockVersion(t.bun);
  else if (t.devenv) expected = devenvPinned();

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
    case "devenv-shell":
      return "devenv shell   # (or: direnv allow — then the shell auto-enters with the pinned versions)";
    case "bun-install":
      return `bun install   # syncs ${t.name} to ${expected} from bun.lock`;
    case "devenv-bin":
      return `install devenv v${expected} exactly — see https://github.com/cachix/devenv/releases/tag/v${expected}`;
    default:
      return `align ${t.name} to ${expected}`;
  }
}
