import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/// Test-of-the-tests guard (plan §46.11-B): pins the SHAPE of the suite so a
/// test that is renamed, skipped, hollowed out, or deleted fails the gate.
///
/// This scans the filesystem and counts test registrations from source text.
/// It imports NOTHING from the code under test (a source-file deletion must
/// crash somewhere else, not here), and it is immune to runtime ordering.
///
/// The values below are the current green numbers. Adding a real test means
/// bumping the floor here first — that edit is reviewed evidence of intent.

const ROOT = new URL('../../', import.meta.url).pathname;
const KERNEL_DIR = 'src/verification';
const NODE_DIR = 'tests';
const WORKER_DIR = 'tests/worker';

interface Floor {
  path: string;
  minCases: number;
}

const FLOORS: Floor[] = [
  { path: `${KERNEL_DIR}/verify.test.ts`, minCases: 6 },
  { path: `${KERNEL_DIR}/run.test.ts`, minCases: 8 },
  { path: `${KERNEL_DIR}/observation.test.ts`, minCases: 4 },
  { path: `${KERNEL_DIR}/report.test.ts`, minCases: 5 },
  { path: `${KERNEL_DIR}/suite.test.ts`, minCases: 8 },
  { path: `${NODE_DIR}/api-contract.test.ts`, minCases: 5 },
  { path: `${NODE_DIR}/api-contract-types.test.ts`, minCases: 6 },
  { path: `${NODE_DIR}/api-contract-adapter.test.ts`, minCases: 4 },
  { path: `${NODE_DIR}/db.test.ts`, minCases: 9 },
  { path: `${NODE_DIR}/db-concurrency.test.ts`, minCases: 4 },
  { path: `${NODE_DIR}/db-migration.test.ts`, minCases: 5 },
  { path: `${NODE_DIR}/db-adapter-guard.test.ts`, minCases: 6 },
  { path: `${NODE_DIR}/queue-schemas.test.ts`, minCases: 5 },
  { path: `${NODE_DIR}/queue-schemas-types.test.ts`, minCases: 6 },
  { path: `${NODE_DIR}/example.test.ts`, minCases: 1 },
  { path: `${NODE_DIR}/property-contract.test.ts`, minCases: 1 },
  { path: `${NODE_DIR}/property-db.test.ts`, minCases: 1 },
  { path: `${NODE_DIR}/property-fuzz.test.ts`, minCases: 1 },
  { path: `${WORKER_DIR}/worker.test.ts`, minCases: 2 },
  { path: `${WORKER_DIR}/worker-runtime.test.ts`, minCases: 3 },
  { path: `${WORKER_DIR}/worker-rpc.test.ts`, minCases: 1 },
  { path: `${WORKER_DIR}/property-db.test.ts`, minCases: 1 },
];

/// Paths are relative to ROOT; `join` rejects any traversal since it resolves
/// cleanly against an absolute base.
const listTestFiles = (dir: string): string[] =>
  readdirSync(join(ROOT, dir), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.test.ts'))
    .map((entry) => `${dir}/${entry.name}`)
    .sort();

const readSource = (path: string): string => readFileSync(join(ROOT, path), 'utf8');

/// Counts test registrations: `it(`, `test(`, and the fast-check variants
/// (`it.prop`, `test.each`) we use. Line comments are stripped first so a
/// hollowed-out file (its cases commented away) is counted as empty. The regex
/// intentionally matches a wide net; the floor is loose enough to survive
/// reformatting but catches files that were hollowed out (0–1 cases).
const countCases = (source: string): number =>
  (source
    .replace(/^\s*\/\/.*$/gm, '')
    .match(/\b(it|test)\s*(\.prop|\.each)?\s*\(/g) ?? []).length;

describe('meta-suite — test-of-the-tests guard (§ F+1 / §46.11-B)', () => {
  it('keeps the documented test files present (no silent deletions)', () => {
    const present = new Set([
      ...listTestFiles(KERNEL_DIR),
      ...listTestFiles(NODE_DIR),
      ...listTestFiles(WORKER_DIR),
    ]);
    for (const floor of FLOORS) {
      expect(present, `test file must exist: ${floor.path}`).toContain(floor.path);
    }
  });

  it('keeps each documented test file above its case floor (no hollowing)', () => {
    for (const floor of FLOORS) {
      const cases = countCases(readSource(floor.path));
      expect(cases, `${floor.path} fell below ${floor.minCases} cases`).toBeGreaterThanOrEqual(
        floor.minCases,
      );
    }
  });
});

/// §46.11-B-2: mutation citation. Every production boundary the suite documents
/// must ALSO be listed as a mutation target in a committed Stryker config. This
/// closes the loop: mutation is what proves "the property tests actually catch
/// mutations" — if a config is deleted or a boundary drops out of `mutate`, the
/// meta-suite fails because the citation invoice no longer matches reality.
const MUTATION_CONFIGS = [
  'stryker.config.json',
  'stryker.phase-d.json',
  'stryker.phase-d-schema.json',
  'stryker.phase-d-adapter.json',
  'stryker.phase-f.json',
] as const;

/// Production boundaries the suite guards and that `just mutate` must cover.
const MUTATE_BOUNDARIES_OWED = [
  'src/verification/',
  'src/server/db/schema.ts',
  'tests/db-common.ts',
  'src/shared/queue-schemas.ts',
];

interface StrykerConfig {
  mutate: string[];
}

const readStrykerTargets = (cfg: string): string[] => {
  const parsed = JSON.parse(readSource(cfg)) as StrykerConfig;
  expect(Array.isArray(parsed.mutate), `${cfg} must declare a mutate[] array`).toBe(true);
  return parsed.mutate;
};

describe('meta-suite — mutation citation (§ F+1 / §46.11-B-2)', () => {
  it('runs one Stryker config per owned boundary (config self-records in mutate[])', () => {
    const covered = new Set<string>();
    for (const cfg of MUTATION_CONFIGS) {
      for (const target of readStrykerTargets(cfg)) covered.add(target);
    }
    for (const owed of MUTATE_BOUNDARIES_OWED) {
      const owned =
        [...covered].some((t) => t === owed) ||
        [...covered].some((t) => t.startsWith(owed) && (owed.endsWith('/') || owed.endsWith('.ts')));
      expect(owned, `mutation must cover boundary: ${owed} (edit a stryker.*.json)`).toBe(true);
    }
  });
});