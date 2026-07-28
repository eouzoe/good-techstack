import { defineConfig } from 'vitest/config';

// 純 Node 環境的單元測試設定。
//
// 之後要寫「跑在 Workers runtime 裡」的測試時,
// 改用 @cloudflare/vitest-pool-workers 的 cloudflareTest() 插件:
//
//   Import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
//   Export default defineConfig({
//     Plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
//   });
//
// 注意:v0.19 已沒有 defineWorkersConfig 這個匯出。
export default defineConfig({
  test: {
    coverage: {
      include: ['src/shared/queue-schemas.ts', 'src/shared/contracts/index.ts'],
      provider: 'v8',
      reporter: ['text'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    environment: 'node',
    exclude: ['node_modules/**', '.devenv/**', 'dist/**', 'tests/worker/**'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
