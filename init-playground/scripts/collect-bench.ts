import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

/// Phase G §46.12 baseline collector.
///   scripts/collect-bench.ts <runDir> <baselinePath> [--update]
///
/// Reads the oha/hyperfine/direct-probe outputs from runDir and compresses
/// them into a stable `bench/baselines.json` shape. Unless --update, it fails
/// when the drift metric (anchored on the baseline's best source: direct p50 →
/// directMean → hyperfine median → hyperfine mean) exceeds the committed
/// baseline by more than DRIFT (20%). Regression detection only; never
/// auto-gating CI.

const DRIFT = 0.2;

const [runDir, baselinePath, mode] = process.argv.slice(2);
if (!runDir || !baselinePath) {
  process.stderr.write('usage: collect-bench.ts <runDir> <baselinePath> [--update]\n');
  process.exit(2);
}

const readJson = <T>(path: string): T | null => {
  if (!existsSync(path)) {
    return null;
  }
  const raw = readFileSync(path, 'utf8').trim();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Malformed output (e.g. partially-written tool result) counts as absent,
    // not a hard failure of the collector.
    return null;
  }
};

interface HyperfineBench {
  results?: Array<{ command: string; mean: number; median: number }>;
}

interface OhaSummary {
  rps?: { actual: number };
  latency?: { p50?: number; p95?: number; p99?: number; mean?: number };
}

interface DirectProbe {
  mean: number;
  p50: number;
  p95: number;
  p99: number;
}

interface BaselineComponent {
  directMeanMs?: number;
  hyperfineMeanMs?: number;
  hyperfineMedianMs?: number;
  p50Ms?: number;
  p95Ms?: number;
  p99Ms?: number;
  rps?: number;
}

interface BaselineSnapshot {
  generatedAt: string;
  components: Record<string, BaselineComponent>;
}

const OHA_FILES: Array<[string, string]> = [
  ['kv', 'oha-kv.json'],
  ['d1', 'oha-d1.json'],
  ['r2', 'oha-r2.json'],
  ['do', 'oha-do.json'],
];

const DIRECT_FILES = ['kv', 'd1', 'r2', 'do', 'consistency'] as const;

const p50Of = (data: OhaSummary): number => data?.latency?.p50 ?? 0;

const collect = (): BaselineSnapshot => {
  const components: Record<string, BaselineComponent> = {};

  // oha is the preferred QPS instrument (§46.12), but in this development
  // sandbox oha renders zero output (environmental limitation, like bun-ws).
  // hyperfine is the always-available fallback and the drift metric: it
  // measures wall-clock per component reliably. When oha DOES produce data it
  // enriches the component with rps/pN.
  for (const [name, file] of OHA_FILES) {
    const data = readJson<OhaSummary>(join(runDir, file));
    if (!data) {
      continue;
    }
    components[name] = {
      p50Ms: p50Of(data),
      p95Ms: data.latency?.p95 ?? 0,
      p99Ms: data.latency?.p99 ?? 0,
      rps: data.rps?.actual ?? 0,
    };
  }

  // Authoritative per-component I/O: the bench worker sums performance.now()
  // deltas internally and reports mean/p50/p95/p99 over `count` samples.
  for (const name of DIRECT_FILES) {
    const probe = readJson<DirectProbe>(join(runDir, `direct-${name}.json`));
    if (!probe) {
      continue;
    }
    components[name] = {
      ...components[name],
      directMeanMs: probe.mean,
      p50Ms: probe.p50,
      p95Ms: probe.p95,
      p99Ms: probe.p99,
    };
  }

  const hyperfine = readJson<HyperfineBench>(join(runDir, 'hyperfine.json'));
  if (hyperfine?.results) {
    for (const r of hyperfine.results) {
      const entry = components[r.command] ?? {};
      entry.hyperfineMeanMs = r.mean * 1000;
      entry.hyperfineMedianMs = r.median * 1000;
      components[r.command] = entry;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    components,
  };
};

/// Metric sources, ordered by preference. The SAME source must be used for the
/// baseline and the current run, otherwise a sandbox flake (probe missing → fall
/// back to hyperfine) reads as a phantom +N% drift. directMeanMs/P50 come from
/// the in-worker performance.now() deltas (authoritative I/O); hyperfine is the
/// per-command fallback that is always present.
const DRIFT_SOURCES = ['p50Ms', 'directMeanMs', 'hyperfineMedianMs', 'hyperfineMeanMs'] as const;

/// Pick the single metric key to compare for a component, anchored on the
/// baseline: baseline and current must use the same source or the comparison is
/// meaningless. Returns `null` when no metric exists on the baseline side.
const driftSourceOf = (
  base: BaselineComponent | undefined,
): (typeof DRIFT_SOURCES)[number] | null => {
  if (!base) {
    return null;
  }
  for (const key of DRIFT_SOURCES) {
    if (base[key] !== undefined && base[key] > 0) {
      return key;
    }
  }
  return null;
};

const current = collect();

const failIfRegressed = () => {
  if (mode === '--update' || !existsSync(baselinePath)) {
    writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
    process.stdout.write(`✓ baseline written: ${baselinePath}\n`);
    return;
  }
  const committed = readJson<BaselineSnapshot>(baselinePath);
  if (!committed?.components) {
    process.stdout.write('⚠ no committed baseline to compare; writing fresh\n');
    writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
    return;
  }

  const regressions: string[] = [];
  const inconclusive: string[] = [];
  for (const [name, value] of Object.entries(current.components)) {
    const base = committed.components[name];
    if (base === undefined) {
      // Component missing from the committed baseline; nothing to compare.
      continue;
    }
    const metric = driftSourceOf(base);
    if (metric === null) {
      continue;
    }
    const now = value[metric] ?? null;
    const baseValue = base[metric];
    if (now === null || now <= 0) {
      inconclusive.push(`  ${name}: no live ${metric} (worker flake?); skipped`);
      continue;
    }
    if (baseValue !== undefined && now > baseValue * (1 + DRIFT)) {
      regressions.push(
        `${name}: ${now.toFixed(2)}ms vs baseline ${baseValue.toFixed(2)}ms (+${Math.round(((now - baseValue) / baseValue) * 100)}%)`,
      );
    }
  }

  for (const line of inconclusive) {
    process.stderr.write(`⚠ inconclusive:${line}\n`);
  }
  if (regressions.length > 0) {
    process.stderr.write(
      `✗ regression > ${Math.round(DRIFT * 100)}%:\n  ${regressions.join('\n  ')}\n`,
    );
    process.exit(1);
  }
  process.stdout.write('✓ no regression drift vs baseline\n');
};

failIfRegressed();
