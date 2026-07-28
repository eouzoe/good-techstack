/// Bench-only worker entry (phase G, §46.12). NOT wired into production
/// `entry-server.tsx` — launched only by `just perf` via the dedicated
/// `wrangler.bench.jsonc`. Each route performs a real binding I/O and returns
/// the per-call `performance.now()` deltas so oha/drill/hyperfine can hammer a
/// *measured* endpoint. The JSON shape is stable:
/// `{ op, count, deltasMs: number[], p50, p95, p99, mean }`.
///
/// Environment is the generated `Env` (wrangler types) — same bindings the
/// production worker uses, so results represent the real boundary.

interface BenchResult {
  op: string;
  count: number;
  deltasMs: number[];
  p50: number;
  p95: number;
  p99: number;
  mean: number;
}

const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;

const json = (status: number, body: unknown): Response =>
  Response.json(body, { headers: { 'content-type': 'application/json' }, status });

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) {
    return 0;
  }
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx] ?? 0;
};

const summarize = (op: string, deltasMs: number[]): BenchResult => {
  const sorted = [...deltasMs].toSorted((a, b) => a - b);
  return {
    count: deltasMs.length,
    deltasMs,
    mean: deltasMs.reduce((sum, d) => sum + d, 0) / (deltasMs.length || 1),
    op,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
};

const parseCount = (url: URL, fallback: number): number => {
  const raw = url.searchParams.get('count');
  if (raw === null) {
    return fallback;
  }
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(parsed, 10_000);
  }
  return fallback;
};

const benchKV = async (env: Env, count: number): Promise<BenchResult> => {
  const deltas: number[] = [];
  for (let i = 0; i < count; i++) {
    const key = `bench:${crypto.randomUUID()}`;
    const t0 = performance.now();
    await env.KV.put(key, String(i));
    await env.KV.get(key);
    deltas.push(performance.now() - t0);
  }
  return summarize('kv-put-get', deltas);
};

const benchD1 = async (env: Env, count: number): Promise<BenchResult> => {
  const deltas: number[] = [];
  for (let i = 0; i < count; i++) {
    const t0 = performance.now();
    await env.DB.prepare('select 1 where (?) = (?)').bind(i, i).run();
    deltas.push(performance.now() - t0);
  }
  return summarize('d1-select', deltas);
};

const benchR2 = async (env: Env, count: number): Promise<BenchResult> => {
  const deltas: number[] = [];
  for (let i = 0; i < count; i++) {
    const key = `bench:${crypto.randomUUID()}`;
    await env.R2.put(key, new TextEncoder().encode("bench"));
    const t0 = performance.now();
    await env.R2.put(key, new TextEncoder().encode("bench"));
    const obj = await env.R2.get(key);
    await obj?.arrayBuffer();
    deltas.push(performance.now() - t0);
  }
  return summarize('r2-put-get', deltas);
};

const benchDO = async (env: Env, count: number): Promise<BenchResult> => {
  const deltas: number[] = [];
  for (let i = 0; i < count; i++) {
    const t0 = performance.now();
    const id = env.EVENTS_DO.idFromName('bench');
    const stub = env.EVENTS_DO.get(id);
    await stub.fetch('http://bench/ping');
    deltas.push(performance.now() - t0);
  }
  return summarize('do-roundtrip', deltas);
};

const benchAll = async (env: Env, count: number) => ({
  d1: await benchD1(env, count),
  do: await benchDO(env, count),
  kv: await benchKV(env, count),
  r2: await benchR2(env, count),
});

/// Consistency observation (§46.12): write a key, then immediately read it back
/// N times, recording every read latency separately. Returns the raw deltas so
/// the harness can compare the KV (eventually-consistent) vs D1 (serializable)
/// read distribution immediately after a write.
const benchKVConsistency = async (env: Env, count: number) => {
  const key = `consistency:${crypto.randomUUID()}`;
  await env.KV.put(key, 'v');
  const latencies: number[] = [];
  for (let i = 0; i < count; i++) {
    const t0 = performance.now();
    await env.KV.get(key);
    latencies.push(performance.now() - t0);
  }
  return summarize('kv-consistency', latencies);
};

const benchD1Consistency = async (env: Env, count: number): Promise<BenchResult> => {
  await env.DB.prepare(
    "create table if not exists bench_consistency (k text primary key, v int)",
  ).run();
  const key = `consistency-${crypto.randomUUID()}`;
  await env.DB.prepare('insert into bench_consistency (k, v) values (?, 1)').bind(key).run();
  const latencies: number[] = [];
  for (let i = 0; i < count; i++) {
    const t0 = performance.now();
    await env.DB.prepare('select v from bench_consistency where k = ?').bind(key).first();
    latencies.push(performance.now() - t0);
  }
  return summarize('d1-consistency', latencies);
};

/// Route a single bench op to its measuring function. Sequentially awaited
/// (intentional: each sample is a real binding I/O timed around it).
const benchOp = async (env: Env, op: string, count: number) => {
  switch (op) {
    case 'kv': {
      return benchKV(env, count);
    }
    case 'd1': {
      return benchD1(env, count);
    }
    case 'r2': {
      return benchR2(env, count);
    }
    case 'do': {
      return benchDO(env, count);
    }
    case 'consistency': {
      return {
        d1: await benchD1Consistency(env, count),
        kv: await benchKVConsistency(env, count),
      };
    }
    case 'all': {
      return benchAll(env, count);
    }
    default: {
      return { count, health: 'ok', op };
    }
  }
};

const workerEntry = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/bench/health') {
      return json(HTTP_NOT_FOUND, { error: 'not found' });
    }

    const count = parseCount(url, 100);
    const op = url.searchParams.get('op') ?? '';
    return json(HTTP_OK, await benchOp(env, op, count));
  },
};

export { EventsDO } from '../server/do-events';
export default workerEntry;