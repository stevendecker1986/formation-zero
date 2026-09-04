import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { testHarness } from "../tests/helpers.js";
const h = await testHarness({
  webOrigin: "http://localhost:3200",
  adminOrigin: "http://localhost:3201",
});
const children: ChildProcess[] = [];
const environment = {
  ...process.env,
  ...Object.fromEntries(
    Object.entries(h.config).map(([key, value]) => [key, String(value)]),
  ),
  NEXT_TELEMETRY_DISABLED: "1",
  EXPO_NO_TELEMETRY: "1",
  PORT: "4200",
  API_ORIGIN: "http://127.0.0.1:4200",
};
async function boot(args: string[], url: string, expected: string) {
  const child = spawn(process.execPath, args, {
    env: environment,
    windowsHide: true,
    stdio: "pipe",
  });
  children.push(child);
  let output = "";
  child.stdout?.on("data", (chunk) => {
    output += String(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    output += String(chunk);
  });
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const response = await fetch(url);
      if (response.status === 200 && (await response.text()).includes(expected))
        return;
    } catch {
      /* bounded startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (child.exitCode !== null)
      throw new Error(`Development process failed: ${output}`);
  }
  throw new Error(`Development startup timed out: ${output}`);
}
try {
  await boot(
    ["--import", "tsx", "services/api/src/start.ts"],
    "http://127.0.0.1:4200/health",
    "ok",
  );
  await boot(
    ["node_modules/next/dist/bin/next", "dev", "apps/web", "-p", "3200"],
    "http://localhost:3200",
    "Readiness Starts Here",
  );
  await boot(
    ["node_modules/next/dist/bin/next", "dev", "apps/admin", "-p", "3201"],
    "http://localhost:3201/admin",
    "Access denied",
  );
  await boot(
    [
      "node_modules/expo/bin/cli",
      "start",
      "apps/mobile",
      "--localhost",
      "--port",
      "8091",
    ],
    "http://localhost:8091/status",
    "packager-status:running",
  );
  assert.equal(
    (await fetch("http://127.0.0.1:4200/api/v1/account")).status,
    401,
  );
  console.log(
    "Development smoke passed: API health, Next web/admin rendering, Expo Metro running locally without credentials.",
  );
} finally {
  for (const child of children.reverse()) {
    if (child.exitCode === null) {
      const done = once(child, "exit");
      child.kill();
      await done;
    }
  }
  await h.close();
}
