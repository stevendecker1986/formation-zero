import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { testHarness } from "../tests/helpers.js";
import { migrate } from "../database/migrate.js";
await mkdir(".local", { recursive: true });
const directory = await mkdtemp(resolve(".local/failure-probes-"));
const lintFile = join(directory, "invalid.mjs");
await writeFile(lintFile, "const unused = 1;\n");
const lintConfig = join(directory, "eslint.config.mjs");
await writeFile(
  lintConfig,
  "export default [{ rules: { 'no-unused-vars': 'error' } }];\n",
);
const typeFile = join(directory, "invalid.ts");
await writeFile(typeFile, "const value: string = 42; export { value };\n");
const testFile = join(directory, "invalid.test.mjs");
await writeFile(
  testFile,
  "import { test } from 'node:test'; import assert from 'node:assert/strict'; test('deliberate failure', () => assert.equal(1, 2));\n",
);
const probes = [
  [
    "lint",
    [
      "node_modules/eslint/bin/eslint.js",
      "--no-ignore",
      "--config",
      lintConfig,
      lintFile,
    ],
  ],
  [
    "typecheck",
    [
      "node_modules/typescript/bin/tsc",
      "--strict",
      "--noEmit",
      "--skipLibCheck",
      typeFile,
    ],
  ],
  ["test", ["--test", testFile]],
] as const;
for (const [name, args] of probes) {
  const result = spawnSync(process.execPath, [...args], {
    encoding: "utf8",
    windowsHide: true,
  });
  assert.notEqual(
    result.status,
    0,
    `${name} incorrectly accepted invalid input`,
  );
  assert.notEqual(result.status, null, `${name} did not execute`);
  console.log(
    `Failure probe passed: ${name} rejected invalid input (exit ${result.status}).`,
  );
}
const h = await testHarness();
try {
  const migrationDirectory = join(directory, "migrations");
  await mkdir(migrationDirectory);
  await writeFile(
    join(migrationDirectory, "999_invalid.sql"),
    "CREATE TABLE probe_rollback (id text); CREATE TABLE deliberate_invalid (id INVALID_SQL_TYPE);",
  );
  await assert.rejects(migrate(h.pool, migrationDirectory));
  assert.equal(
    (await h.pool.query("SELECT to_regclass('probe_rollback') AS name")).rows[0]
      ?.name,
    null,
  );
  assert.equal(
    (
      await h.pool.query("SELECT 1 FROM schema_migrations WHERE name=$1", [
        "999_invalid.sql",
      ])
    ).rowCount,
    0,
  );
  console.log(
    "Failure probe passed: migration runner rejected invalid SQL and rolled back the transaction.",
  );
} finally {
  await h.close();
}
