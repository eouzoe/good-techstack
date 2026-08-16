/// <reference lib="ESNext" />
///
/// 測試的測試 — mutation testing harness for src/verification.
///
/// 每個 mutation 對應一個「真實可能發生的語義錯誤」。把變異寫回來源檔,
/// 跑 scoped `bun test` 判斷 killed(測試時失敗→有守住)或 survived(沒守住)。
/// 用 bun test(非 vitest):啟動快 ~35x,且每次 fresh process,無 cache flaky。
///
/// 用法: bun run scripts/mutation-check.ts;檔案永遠被還原。

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

interface Mutation {
  equivalent?: boolean;
  file: string;
  from: string;
  id: string;
  note: string;
  replaceAll: boolean;
  to: string;
}

const ROOT = process.cwd();
const VERIFICATION_DIR = 'src/verification';

const MUTATIONS: Mutation[] = [
  // --- verify.ts: oracle 判定 ---
  {
    file: `${VERIFICATION_DIR}/verify.ts`,
    from: 'if (satisfied) {',
    id: 'oracle-inverted',
    note: 'oracle 結果反向',
    replaceAll: false,
    to: 'if (!satisfied) {',
  },
  {
    file: `${VERIFICATION_DIR}/verify.ts`,
    from: 'if (satisfied) {',
    id: 'oracle-always-true',
    note: '忽略 oracle,永遠 Ok',
    replaceAll: false,
    to: 'if (true) {',
  },
  {
    file: `${VERIFICATION_DIR}/verify.ts`,
    from: 'if (satisfied) {',
    id: 'oracle-always-false',
    note: '忽略 oracle,永遠 Err',
    replaceAll: false,
    to: 'if (false) {',
  },
  // --- verify.ts: 三個 stage 的 wrapDefect ---
  {
    file: `${VERIFICATION_DIR}/verify.ts`,
    from: "const value = wrapDefect('execute', execute);",
    id: 'execute-unwrapped',
    note: 'execute 不再包 Panic',
    replaceAll: false,
    to: 'const value = execute();',
  },
  {
    file: `${VERIFICATION_DIR}/verify.ts`,
    from: "const observation = wrapDefect('observe', () => observe(value));",
    id: 'observe-unwrapped',
    note: 'observe 不再包 Panic',
    replaceAll: false,
    to: 'const observation = observe(value);',
  },
  {
    file: `${VERIFICATION_DIR}/verify.ts`,
    from: "const satisfied = wrapDefect('oracle', () => oracle(observation));",
    id: 'oracle-unwrapped',
    note: 'oracle 不再包 Panic',
    replaceAll: false,
    to: 'const satisfied = oracle(observation);',
  },
  {
    file: `${VERIFICATION_DIR}/verify.ts`,
    from: "const observation = wrapDefect('observe', () => observe(value));",
    id: 'observe-stage-skipped',
    note: 'observe 被跳過,直接拿原始值',
    replaceAll: false,
    to: 'const observation = value as TObservation;',
  },
  // --- verify.ts: 錯誤內容 ---
  {
    file: `${VERIFICATION_DIR}/verify.ts`,
    // oxlint-disable-next-line no-template-curly-in-string -- literal source text being matched, not an interpolation.
    from: '`Invariant "${invariant}" did not hold for observation: ${JSON.stringify(observation)}`',
    id: 'failure-message-mutated',
    note: 'failure 訊息失去 invariant 標籤',
    replaceAll: false,
    to: '`no invariant label in failure`',
  },
  // --- result.ts: tag identity ---
  {
    file: `${VERIFICATION_DIR}/result.ts`,
    from: "TaggedError('VerificationFailed')",
    id: 'failure-tag-renamed',
    note: '_tag 被改名(對外契約身份)',
    replaceAll: false,
    to: "TaggedError('VerificationBroken')",
  },
  // --- run.ts: identity ---
  {
    file: `${VERIFICATION_DIR}/run.ts`,
    from: 'const createRunId = (): string => crypto.randomUUID();',
    id: 'run-id-constant',
    note: 'run_id 永遠一樣',
    replaceAll: false,
    to: "const createRunId = (): string => '00000000-0000-0000-0000-000000000000';",
  },
  // --- run.ts: 分流 ---
  {
    file: `${VERIFICATION_DIR}/run.ts`,
    from: "status: 'ok',",
    id: 'status-always-failed',
    note: '成功 run 也被標成 failed',
    replaceAll: false,
    to: "status: 'failed',",
  },
  {
    file: `${VERIFICATION_DIR}/run.ts`,
    from: "status: 'failed',",
    id: 'status-always-ok',
    note: '失敗 run 也被標成 ok',
    replaceAll: false,
    to: "status: 'ok',",
  },
  // --- run.ts: 時間量測 ---
  {
    file: `${VERIFICATION_DIR}/run.ts`,
    from: 'durationMs: finishedAt - startedAt',
    id: 'duration-inverted',
    note: 'duration 量測被算反(負值)',
    replaceAll: true,
    to: 'durationMs: startedAt - finishedAt',
  },
  {
    file: `${VERIFICATION_DIR}/run.ts`,
    from: 'durationMs: finishedAt - startedAt',
    id: 'duration-constant',
    note: 'duration 被硬編成 0',
    replaceAll: true,
    to: 'durationMs: 0',
  },
  {
    file: `${VERIFICATION_DIR}/run.ts`,
    from: 'const startedAt = Date.now();',
    id: 'started-at-constant',
    note: 'startedAt 被硬編成 0',
    replaceAll: false,
    to: 'const startedAt = 0;',
  },
  // --- observation.ts: event name 身份 ---
  {
    file: `${VERIFICATION_DIR}/observation.ts`,
    from: "name: 'verification.run.started',",
    id: 'event-started-renamed',
    note: 'started 事件名被竄改',
    replaceAll: false,
    to: "name: 'verification.run.failed',",
  },
  {
    file: `${VERIFICATION_DIR}/observation.ts`,
    from: "name: 'verification.run.completed',",
    id: 'event-completed-renamed',
    note: 'completed 事件名被竄改',
    replaceAll: false,
    to: "name: 'verification.run.failed',",
  },
  {
    file: `${VERIFICATION_DIR}/observation.ts`,
    from: "name: 'verification.run.failed',",
    id: 'event-failed-renamed',
    note: 'failed 事件名被竄改',
    replaceAll: false,
    to: "name: 'verification.run.started',",
  },
  // --- report.ts: machine-readable 形狀 ---
  {
    file: `${VERIFICATION_DIR}/report.ts`,
    from: 'run_id: run.runId,',
    id: 'report-run-id-dropped',
    note: 'report 失去 run_id(對外契約身份)',
    replaceAll: false,
    to: "run_id: 'missing',",
  },
  {
    file: `${VERIFICATION_DIR}/report.ts`,
    from: 'status: run.status,',
    id: 'report-status-flattened',
    note: 'report 永遠回報 ok',
    replaceAll: false,
    to: "status: 'ok',",
  },
  {
    file: `${VERIFICATION_DIR}/report.ts`,
    from: 'events: run.events.map(serializeEvent),',
    id: 'report-events-dropped',
    note: 'report 不再包含事件',
    replaceAll: false,
    to: 'events: [],',
  },
  {
    file: `${VERIFICATION_DIR}/report.ts`,
    from: 'const summaryLine = JSON.stringify(report);',
    id: 'report-summary-line-constant',
    note: 'JSONL 最後一行失去 report 內容',
    replaceAll: false,
    to: "const summaryLine = '{}';",
  },
  // --- suite.ts: 彙總語義 ---
  {
    file: `${VERIFICATION_DIR}/suite.ts`,
    from: "const verified = runs.filter((run) => run.status === 'ok').length;",
    id: 'suite-verified-inverted',
    note: 'verified 數到的是 failed runs',
    replaceAll: false,
    to: "const verified = runs.filter((run) => run.status === 'failed').length;",
  },
  {
    file: `${VERIFICATION_DIR}/suite.ts`,
    from: "status: 'failed',",
    id: 'suite-status-always-ok',
    note: '有失敗 case 也標成 ok',
    replaceAll: false,
    to: "status: 'ok',",
  },
  {
    file: `${VERIFICATION_DIR}/suite.ts`,
    from: 'runs,',
    id: 'suite-runs-dropped',
    note: '捨棄 child runs,只剩計數',
    replaceAll: true,
    to: 'runs: [],',
  },
  {
    file: `${VERIFICATION_DIR}/report.ts`,
    from: "status: 'passed',",
    id: 'suite-report-status-flattened',
    note: 'suite report 永遠報 passed',
    replaceAll: false,
    to: "status: 'failed',",
  },
];

interface MutationResult {
  equivalent: boolean;
  id: string;
  killed: boolean;
  note: string;
}

const backupFiles = (): Map<string, string> => {
  const backups = new Map<string, string>();
  for (const file of new Set(MUTATIONS.map((mutation) => mutation.file))) {
    backups.set(file, readFileSync(file, 'utf8'));
  }
  return backups;
};

const EXIT_CODE_ERROR = -1;
const TEST_TIMEOUT_MS = 15_000;

const runTests = (): { exitCode: number; output: string } => {
  const result = spawnSync('bun', ['test', VERIFICATION_DIR], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: TEST_TIMEOUT_MS,
  });
  return { exitCode: result.status ?? EXIT_CODE_ERROR, output: result.stdout };
};

const hasTarget = (mutation: Mutation, content: string): boolean =>
  content.split(mutation.from).length > 1;

const applyMutation = (mutation: Mutation): boolean => {
  const content = readFileSync(mutation.file, 'utf8');
  if (!hasTarget(mutation, content)) {
    console.log(`[skip] ${mutation.id}: target not found in ${mutation.file}`);
    return false;
  }
  const next = replaceOnce(mutation, content);
  writeFileSync(mutation.file, next, 'utf8');
  return true;
};

const replaceOnce = (mutation: Mutation, content: string): string => {
  if (mutation.replaceAll) {
    return content.replaceAll(mutation.from, mutation.to);
  }
  return content.replace(mutation.from, mutation.to);
};

const statusLabel = (result: MutationResult): string => {
  if (result.killed) {
    return '[killed]';
  }
  if (result.equivalent) {
    return '[equivalent]';
  }
  return '[SURVIVED]';
};

const runMutation = (
  mutation: Mutation,
  backups: Map<string, string>,
  results: MutationResult[],
): void => {
  const { exitCode } = runTests();
  const survived = exitCode === 0;
  results.push({
    equivalent: Boolean(mutation.equivalent),
    id: mutation.id,
    killed: !survived,
    note: mutation.note,
  });
  writeFileSync(mutation.file, backups.get(mutation.file)!, 'utf8');
};

const summarize = (results: MutationResult[]): void => {
  const killed = results.filter((result) => result.killed);
  const nonEquivalentSurvived = results.filter((result) => !result.killed && !result.equivalent);
  const acceptedSurvived = results.filter((result) => !result.killed && result.equivalent);

  console.log(
    `\n${killed.length} killed, ${acceptedSurvived.length} equivalent, ${nonEquivalentSurvived.length} non-equivalent survived`,
  );

  if (nonEquivalentSurvived.length > 0) {
    console.log(
      '\n⚠️  non-equivalent survivors = tests do NOT pin this semantic; add an assertion first',
    );
    process.exitCode = 1;
  }
};

const printResults = (results: MutationResult[]): void => {
  console.log('\n--- mutation results ---');
  for (const result of results) {
    const label = statusLabel(result);
    let note = `${label} ${result.id} — ${result.note}`;
    if (result.equivalent) {
      note += ' (equivalent mutant — ms-scale runs are indistinguishable)';
    }
    console.log(note);
  }
};

const reportResults = (results: MutationResult[]): void => {
  printResults(results);
  summarize(results);
};

const runAllMutations = (backups: Map<string, string>): MutationResult[] => {
  const results: MutationResult[] = [];
  for (const mutation of MUTATIONS) {
    if (applyMutation(mutation)) {
      runMutation(mutation, backups, results);
    } else {
      console.log(`[skip] ${mutation.id}: target not found in ${mutation.file}`);
    }
  }
  return results;
};

const main = (): void => {
  const baseline = runTests();
  if (baseline.exitCode !== 0) {
    console.log('baseline tests FAILED — refusing to run mutations until green');
    process.exit(1);
  }

  const backups = backupFiles();
  const results = runAllMutations(backups);
  reportResults(results);
};

main();
