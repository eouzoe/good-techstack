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

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const sh = (cmd, args, opts = {}) => {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      ...opts,
    }).trim();
  } catch {
    return undefined;
  }
};

// --- expected versions from the project's own pins -------------------------

// Devenv pins its own CLI version in devenv.yaml (ref=vX.Y.Z)
const devenvPinned = () => {
  const text = readFileSync(join(root, "devenv.yaml"), "utf8");
  const m = /ref=v(?<version>\d+\.\d+\.\d+)/u.exec(text);
  return m ? m.groups.version : undefined;
};

// Bun.lock is JSON5; pull the resolved version of an npm package.
const bunLockVersion = (name) => {
  const text = readFileSync(join(root, "bun.lock"), "utf8");
  const escapedName = name.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);
  const pattern = `"${escapedName}":\\s*\\[\\s*"[^"]*@([^"]+)"`;
  const re = new RegExp(pattern, "u");
  const m = re.exec(text);
  return m ? m[1] : undefined;
};

// Nixpkgs tool version. We evaluate the EXACT revision pinned in devenv.lock
// (not the floating `nixpkgs` channel), so this matches what `devenv shell`
// Actually provides and works offline once that revision is in the store.
//
// Devenv.lock is a flake-lock-format JSON with MANY nixpkgs nodes (each pulled
// In by a different dependency). Only the one reachable from
// Nodes.root.inputs.nixpkgs is the toolchain nixpkgs — follow that pointer
// Rather than grabbing the first "nixpkgs" match, which would be wrong.
const nixpkgsRev = () => {
  const lock = JSON.parse(readFileSync(join(root, "devenv.lock"), "utf8"));
  const nodeName = lock?.nodes?.root?.inputs?.nixpkgs;
  if (!nodeName) {
    return undefined;
  }
  const result = lock?.nodes?.[nodeName]?.locked?.rev ?? undefined;
  return result;
};
const nixpkgsVersion = (attr) => {
  const rev = nixpkgsRev();
  if (!rev) {
    return undefined;
  }
  return sh("nix", ["eval", `github:NixOS/nixpkgs/${rev}#${attr}.version`, "--raw"], {
    timeout: 20_000,
  });
};

// --- local version on this machine -----------------------------------------

const localVersion = (name, flag = "--version") => {
  const out = sh(name, [flag]);
  if (!out) {
    return undefined;
  }
  const m = /v?(?<semver>\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?)/u.exec(out);
  return m ? m.groups.semver : undefined;
};

const parseSemver = (version) => {
  const m = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/u.exec(String(version));
  if (!m) {
    return undefined;
  }
  return {
    major: Number(m.groups.major),
    minor: Number(m.groups.minor),
    patch: Number(m.groups.patch),
  };
};
const compareSemver = (a, b) => {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) {
    return undefined;
  }
  const keys = ["major", "minor", "patch"];
  for (let idx = 0; idx < keys.length; idx++) {
    const key = keys[idx];
    if (pa[key] !== pb[key]) {
      if (pa[key] < pb[key]) {
        return -1;
      }
      return 1;
    }
  }
  return 0;
};

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
for (const tool of tools) {
  const local = localVersion(tool.name);
  let expected;
  if (tool.nix) {
    expected = nixpkgsVersion(tool.nix);
  } else if (tool.bun) {
    expected = bunLockVersion(tool.bun);
  } else if (tool.devenv) {
    expected = devenvPinned();
  }

  if (local === undefined) {
    console.log(`?  ${tool.name}  — not found on PATH (run \`devenv shell\` to get it)`);
    continue;
  }
  if (expected === undefined) {
    console.log(
      `?  ${tool.name}  — local ${local} (could not resolve project version; run \`devenv shell\`)`,
    );
    continue;
  }
  const comparison = compareSemver(local, expected);
  if (comparison === 0) {
    console.log(`OK        ${tool.name}  ${local}  (matches project)`);
  } else if (comparison !== undefined) {
    mismatches++;
    const newer = comparison > 0 ? "NEWER than project" : "OLDER than project";
    console.log(`MISMATCH  ${tool.name}  local ${local} is ${newer} (project provides ${expected})`);
    console.log(`          fix: ${fixCommand(tool, expected)}`);
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

const fixCommand = (tool, expected) => {
  switch (tool.fix) {
    case "devenv-shell": {
      return "devenv shell   # (or: direnv allow — then the shell auto-enters with the pinned versions)";
    }
    case "bun-install": {
      return `bun install   # syncs ${tool.name} to ${expected} from bun.lock`;
    }
    case "devenv-bin": {
      return `install devenv v${expected} exactly — see https://github.com/cachix/devenv/releases/tag/v${expected}`;
    }
    default: {
      return `align ${tool.name} to ${expected}`;
    }
  }
};
