import { defineConfig } from "@rstest/core";
import { withRsbuildConfig } from "@rstest/adapter-rsbuild";

export default defineConfig({
  extends: withRsbuildConfig(),
  globals: true,
  include: ["src/**/*.{test,spec}.{ts,tsx}"],
  passWithNoTests: true,
  setupFiles: ["./rstest.setup.ts"],
  testEnvironment: "jsdom",
});
