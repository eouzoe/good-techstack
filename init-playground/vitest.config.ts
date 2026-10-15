import { defineConfig } from 'vitest/config';

// 純 Node 環境的單元測試設定。
//
// 「跑在 Workers runtime 裡」的測試走獨立 config(vitest.worker.config.ts),
// 使用 @cloudflare/vitest-plugin 的 cloudflareTest() 插件:
//
//   Import { cloudflareTest } from "@cloudflare/vitest-plugin";
//   Export default defineConfig({
//     Plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.worker-test.toml" } })],
//   });
//
// 注意:此整合已沒有 defineWorkersConfig 這個匯出。
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
