/// `just test` entry for the Verification Kernel (plan §1.3).
///
/// Runs a suite of Invariant cases through the Kernel and emits:
///   - a human summary (`✓ N verified / ✗ M failed / verification: vr_...`)
///   - a §1.4 machine-readable JSON summary on stdout
///   - per-run JSONL detail (report.ts), settable via `--jsonl`
///
/// Exit code: 0 when every invariant held, non-zero otherwise — so CI (later)
/// and humans share one gate. `just test` is THE entry; there is no second
/// runner state (plan §1.10 rule 4).

import { suiteToJson } from '../src/verification/report';
import { runSuite } from '../src/verification/suite';
import { type VerifyOptions } from '../src/verification/verify';

const BALANCE_AFTER_DEPOSIT = 100;
const BALANCE_INVARIANT = 'balance never drops below zero after a deposit';
const RATE_LIMIT_INVARIANT = 'rate limit stays below the allowed burst';
const RATE_LIMIT_COUNT = 3;
const RATE_LIMIT_BURST = 5;
const HASH_CONTENT = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const HASH_INVARIANT = 'content hash stays a stable 64-hex digest';
const HASH_DIGEST_PATTERN = /^[0-9a-f]{64}$/u;

const cases: VerifyOptions<unknown, unknown>[] = [
  {
    execute: () => BALANCE_AFTER_DEPOSIT,
    invariant: BALANCE_INVARIANT,
    observe: (value: unknown) => value,
    oracle: (value: unknown) => typeof value === 'number' && value > 0,
  },
  {
    execute: () => RATE_LIMIT_COUNT,
    invariant: RATE_LIMIT_INVARIANT,
    observe: (value: unknown) => value,
    oracle: (value: unknown) => typeof value === 'number' && value <= RATE_LIMIT_BURST,
  },
  {
    execute: () => HASH_CONTENT,
    invariant: HASH_INVARIANT,
    observe: (value: unknown) => value,
    oracle: (value: unknown) => typeof value === 'string' && HASH_DIGEST_PATTERN.test(value),
  },
];

const main = (): void => {
  const suite = runSuite(cases);
  const summary = suiteToJson(suite);
  console.log(`✓ ${suite.verified} verified / ✗ ${suite.failed} failed`);
  console.log(`verification: ${suite.runId}`);
  console.log(summary);
  if (suite.status === 'ok') {
    process.exitCode = 0;
  } else {
    process.exitCode = 1;
  }
};

main();
