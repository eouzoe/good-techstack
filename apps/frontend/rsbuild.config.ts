import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/rsbuild";

export default defineConfig({
  server: {
    port: 5173,
  },
  plugins: [pluginReact(), tanstackStart()],
});
