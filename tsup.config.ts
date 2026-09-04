import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["services/api/src/start.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist/api",
  noExternal: [/^@formation-zero\//],
  clean: true,
});
