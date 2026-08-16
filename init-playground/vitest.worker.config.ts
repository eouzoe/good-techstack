import { fileURLToPath, URL } from 'node:url';

import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

// Worker runtime 測試設定(Phase E)。
//
// 跑在「真正的 workerd runtime」inside Miniflare,不是 node env。
// 用 `cloudflare:test`(env / SELF / applyD1Migrations)驅動:
//   - `env.DB` 是真 D1 binding(每測試檔案獨立 storage)。
//   - `SELF` 對 main worker(entry-server)發 fetch,打通
//     Hono → oRPC → Valibot → Drizzle → D1 整條路徑。
//
// 與 `vitest.config.ts`(純 node 單元)互斥,不相混 ——
// 這個 config 是 Phase E 專用,`bun run test` 不會碰它。
//
// 注意:v0.20 直接從根匯出 `readD1Migrations`(無 `/config` 子路徑);
// Worker-configuration.d.ts 提供 `Cloudflare.Env` 綁定型別(currently
// 由 `wrangler types` 生成)。
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: './wrangler.worker-test.toml',
      },
    }),
  ],
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('src/shared', import.meta.url)),
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  test: {
    fileParallelism: false,
    include: ['tests/worker/**/*.test.ts'],
  },
});
