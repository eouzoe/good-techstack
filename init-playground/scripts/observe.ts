/// Local-debug observation sink for the Verification Kernel (plan §1.4/§1.5).
///
/// Runs a handful of realistic verification cases and emits each `VerificationRun`
/// as one JSONL line (report.ts), so during local debugging you can:
///
///   just observe                          # pretty summary + JSONL stream
///   just observe | jaq 'select(.status == "failed")'
///   just observe > /tmp/runs.jsonl        # same shape as devenv json:file traces
///
/// This is the Observation boundary used locally. Production stays on
/// devenv's built-in tracing + Cloudflare Observability; this script exists
/// only to make kernel detail inspectable while debugging (no OTel, no DB).

import { reportToJsonl, serializeRun } from '../src/verification/report';
import { runVerification } from '../src/verification/run';

const BALANCE_AFTER_DEPOSIT = 100;
const BALANCE_INVARIANT = 'balance never drops below zero after a deposit';
const RATE_LIMIT_INVARIANT = 'rate limit stays below the allowed burst';
const OBSERVED_REQUESTS = 3;
const ALLOWED_BURST = 5;

const balanceOk = {
  execute: () => BALANCE_AFTER_DEPOSIT,
  invariant: BALANCE_INVARIANT,
  observe: (balance: number) => balance,
  oracle: (balance: number) => balance > 0,
};

const balanceViolated = {
  execute: () => 0,
  invariant: BALANCE_INVARIANT,
  observe: (balance: number) => balance,
  oracle: (balance: number) => balance > 0,
};

const rateLimitOk = {
  execute: () => OBSERVED_REQUESTS,
  invariant: RATE_LIMIT_INVARIANT,
  observe: (count: number) => count,
  oracle: (count: number) => count <= ALLOWED_BURST,
};

const main = (): void => {
  const cases = [balanceOk, balanceViolated, rateLimitOk];
  const runs = cases.map((options) => runVerification(options));
  for (const run of runs) {
    process.stdout.write(`${reportToJsonl(serializeRun(run))}\n`);
  }
  const verified = runs.filter((run) => run.status === 'ok').length;
  const failed = runs.length - verified;
  console.error(`\n✓ ${verified} verified / ✗ ${failed} failed`);
};

main();
