import { defineConfig } from "@rstest/core";
import { withRsbuildConfig } from "@rstest/adapter-rsbuild";

export default defineConfig({
  extends: withRsbuildConfig(),
  testEnvironment: "jsdom",
  globals: true,
  setupFiles: ["./rstest.setup.ts"],
  include: ["src/**/*.{test,spec}.{ts,tsx}"],
  passWithNoTests: true,
});
