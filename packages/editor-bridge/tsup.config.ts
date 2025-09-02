import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["umd"],
  globalName: "WebExpBridge",
  clean: true,
  dts: true,
  sourcemap: true,
  minify: true,
  treeshake: true
});
