#!/usr/bin/env bun
import { $ } from "bun";

const WRANGLER_OUTPUT = `/tmp/deploy-${Date.now()}.json`;

$.nothrow();

// ── 1. Check environment ──────────────────────────────────────
console.log("==> 1/5  Checking environment ...");

if (!(await Bun.file("wrangler.toml").exists())) {
  console.log("  Error: wrangler.toml not found. Create one first.");
  process.exit(1);
}

const { exitCode: whoamiCode } = await $`wrangler whoami`.quiet();
if (whoamiCode !== 0) {
  console.log("  Error: not authenticated. Run `wrangler login` first.");
  process.exit(1);
}
console.log("  OK");

// ── 2. Upload version (0% traffic) ────────────────────────────
console.log("==> 2/5  Uploading version (0% traffic) ...");

const { stdout: uploadOut } = await $`WRANGLER_OUTPUT_FILE_PATH=${WRANGLER_OUTPUT} wrangler versions upload`;
console.log(uploadOut);

const outputText = await Bun.file(WRANGLER_OUTPUT).text();
const lines = outputText.trim().split("\n");
let workerName = "";
let versionId = "";
for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    if (entry.type === "version-upload") {
      workerName = entry.worker_name;
      versionId = entry.version_id;
    }
  } catch {
    // skip non-JSON lines
  }
}

if (!versionId) {
  console.log("  Error: could not determine version ID from wrangler output");
  process.exit(1);
}
console.log(`  Version: ${versionId}`);

// ── 3. Smoke test via version override ────────────────────────
console.log("==> 3/5  Smoke test ...");

const publicUrl = Bun.env.PUBLIC_URL ?? "";
if (publicUrl) {
  const header = `Cloudflare-Workers-Version-Overrides: ${workerName}="${versionId}"`;
  const { exitCode: smokeCode } = await $`curl -sf -H ${header} ${publicUrl}`.quiet();
  if (smokeCode !== 0) {
    console.log(`  Error: smoke test failed (HTTP ${smokeCode})`);
    process.exit(1);
  }
  console.log("  OK");
} else {
  console.log("  Skipped (no PUBLIC_URL set)");
  console.log("  Run: secretspec secret set PUBLIC_URL https://your-domain.com");
}

// ── 4. Deploy to 100% ─────────────────────────────────────────
console.log("==> 4/5  Deploying version to 100% traffic ...");

const { exitCode: deployCode } = await $`wrangler versions deploy --yes`;
if (deployCode !== 0) {
  console.log("  Error: deployment failed");
  process.exit(1);
}
console.log("  OK");

// ── 5. Done ───────────────────────────────────────────────────
console.log("==> 5/5  Done.");
console.log("  Check wrangler tail or Cloudflare Observability for errors.");
if (publicUrl) {
  console.log(`  Verify at: ${publicUrl}`);
}
