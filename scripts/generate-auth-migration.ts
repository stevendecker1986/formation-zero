import { getMigrations } from "better-auth/db/migration";
import { writeFile, mkdir } from "node:fs/promises";
import { loadConfig } from "@formation-zero/config";
import { createPool } from "../services/api/src/db.js";
import { createAuth } from "../services/api/src/auth.js";
const config = loadConfig(process.env);
const pool = createPool(config);
try {
  const auth = createAuth(config, pool, async () => {});
  const result = await getMigrations(auth.options);
  await mkdir("database/migrations", { recursive: true });
  await writeFile(
    "database/migrations/001_auth.sql",
    await result.compileMigrations(),
    { flag: "wx" },
  );
  console.log("Generated versioned auth migration; review before applying.");
} finally {
  await pool.end();
}
