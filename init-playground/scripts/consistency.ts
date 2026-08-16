import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

/// Phase G §46.12 consistency observation. Writes to KV (eventually
/// consistent) and D1 (serializable), then reads back immediately N times,
/// recording the read-latency distribution. The key observation: post-write
/// reads on KV hit local cache (fast, but possibly stale in prod); D1 reads
/// are strongly consistent. Results land in bench/consistency.json so a human
/// can compare the two distributions.
///
/// Usage: bun run scripts/consistency.ts <count>
const count = Number.parseInt(process.argv[2] ?? '50', 10) || 50;
const base = process.env.BENCH_BASE ?? 'http://localhost:8790';

const run = async () => {
  const url = `${base}/bench/health?op=consistency&count=${count}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`bench worker returned ${res.status}`);
  }
  const data = (await res.json()) as {
    kv: { op: string; p50: number; p95: number; p99: number; mean: number };
    d1: { op: string; p50: number; p95: number; p99: number; mean: number };
  };

  const summary = {
    count,
    kv: data.kv,
    d1: data.d1,
    note: 'post-write read latency distribution (KV eventual vs D1 strong)',
  };
  writeFileSync(
    join(process.cwd(), 'bench', 'consistency.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  console.log(JSON.stringify(summary, null, 2));
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
