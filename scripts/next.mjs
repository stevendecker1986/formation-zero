import { spawn } from "node:child_process";
import { loadConfig } from "@formation-zero/config";
loadConfig(process.env);
const [app, command] = process.argv.slice(2);
if (!["web", "admin"].includes(app) || !["dev", "start"].includes(command))
  throw new Error("Expected web|admin dev|start");
for (const key of ["API_ORIGIN", "WEB_ORIGIN", "ADMIN_ORIGIN"])
  if (!process.env[key]) throw new Error(`Missing ${key}`);
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    command,
    `apps/${app}`,
    "-p",
    app === "web" ? "3000" : "3001",
  ],
  {
    stdio: "inherit",
    windowsHide: true,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
