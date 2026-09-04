import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import type pg from "pg";
import { createPool, transaction } from "../services/api/src/db.js";
import { loadConfig } from "@formation-zero/config";
export async function migrate(
  pool: pg.Pool,
  directory = "database/migrations",
): Promise<string[]> {
  return transaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(4612001)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const files = (await readdir(directory))
      .filter((file) => file.endsWith(".sql"))
      .sort();
    const applied: string[] = [];
    for (const name of files) {
      const sql = await readFile(`${directory}/${name}`, "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const prior = await client.query<{ checksum: string }>(
        "SELECT checksum FROM schema_migrations WHERE name = $1",
        [name],
      );
      if (prior.rows[0]) {
        if (prior.rows[0].checksum !== checksum)
          throw new Error(`Migration checksum mismatch: ${name}`);
        continue;
      }
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations(name, checksum) VALUES ($1,$2)",
        [name, checksum],
      );
      applied.push(name);
    }
    return applied;
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const pool = createPool(loadConfig(process.env));
  try {
    console.log({ migrations: await migrate(pool) });
  } finally {
    await pool.end();
  }
}
