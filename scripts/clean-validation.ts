import {
  mkdir,
  mkdtemp,
  copyFile,
  readFile,
  writeFile,
} from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { sourceFiles } from "./source-files.js";
import { createPool } from "../services/api/src/db.js";

// New source-only directory and a brand-new, disposable database. No live source
// or existing database is deleted; artifacts are retained for review.
await mkdir(".local", { recursive: true });
await mkdir("validation-artifacts", { recursive: true });
const directory = await mkdtemp(join(tmpdir(), "formation-zero-clean-"));
const files = await sourceFiles();
for (const path of files) {
  const target = join(directory, path);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(path, target);
}
const password = await readFile(".local/database-password", "utf8");
const databaseName = `fz_clean_${randomBytes(6).toString("hex")}_test`;
const admin = createPool({
  DATABASE_URL: `postgresql://fz_local:${password}@127.0.0.1:55432/postgres`,
});
await admin.query(`CREATE DATABASE ${databaseName}`); // generated lowercase/hex-only identifier
const databaseUrl = `postgresql://fz_local:${password}@127.0.0.1:55432/${databaseName}`;
const environment = {
  ...process.env,
  CI: "true",
  NEXT_TELEMETRY_DISABLED: "1",
  EXPO_NO_TELEMETRY: "1",
  APP_ENV: "TEST",
  DATABASE_URL: databaseUrl,
  TEST_DATABASE_URL: databaseUrl,
  AUTH_SECRET: randomBytes(48).toString("hex"),
  API_ORIGIN: "http://localhost:4000",
  WEB_ORIGIN: "http://localhost:3000",
  ADMIN_ORIGIN: "http://localhost:3001",
  MAIL_MODE: "LOCAL",
  LEGAL_COMMERCIAL_GATE_APPROVED: "false",
};
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run with npm run validate:clean");
const steps = [
  ["install", ["ci", "--no-fund"]],
  ["migrate", ["exec", "--", "tsx", "database/migrate.ts"]],
  ["seed", ["exec", "--", "tsx", "database/seeds/seed.ts"]],
  ["corpus", ["exec", "--", "tsx", "database/corpus/import.ts"]],
  ["validate", ["run", "validate"]],
  ["failure-probes", ["run", "ci:failure-probes"]],
] as const;
const results: {
  step: string;
  command: string;
  exitCode: number;
  log: string;
}[] = [];
try {
  for (const [step, args] of steps) {
    const logPath = resolve("validation-artifacts", `clean-${step}.log`);
    process.stdout.write(`Clean validation: ${step}\n`);
    const code = await new Promise<number>((resolveCode, reject) => {
      const child = spawn(process.execPath, [npmCli, ...args], {
        cwd: directory,
        env:
          step === "install"
            ? {
                ...process.env,
                CI: "true",
                NEXT_TELEMETRY_DISABLED: "1",
                EXPO_NO_TELEMETRY: "1",
              }
            : environment,
        windowsHide: true,
      });
      let log = "";
      child.stdout.on("data", (chunk) => {
        log += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        log += String(chunk);
      });
      child.on("error", reject);
      child.on("close", async (exitCode) => {
        await writeFile(logPath, log);
        resolveCode(exitCode ?? 1);
      });
    });
    results.push({
      step,
      command: `npm ${args.join(" ")}`,
      exitCode: code,
      log: logPath,
    });
    process.stdout.write(`${step}: exit ${code}\n`);
    if (code !== 0) throw new Error(`Clean ${step} failed. See ${logPath}`);
  }
} finally {
  await writeFile(
    "validation-artifacts/clean-results.json",
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        sourceDirectory: directory,
        database: databaseName,
        results,
      },
      null,
      2,
    ) + "\n",
  );
  await admin.query(`DROP DATABASE ${databaseName} WITH (FORCE)`); // only the generated disposable database created above
  await admin.end();
}
