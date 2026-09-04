import { loadConfig } from "@formation-zero/config";
import { createPool } from "./db.js";
import { createApp } from "./app.js";
import { createLogger } from "./logging.js";
const config = loadConfig(process.env);
const pool = createPool(config);
const migration = await pool.query(
  "SELECT 1 FROM schema_migrations WHERE name = $1",
  ["003_account_hardening.sql"],
);
if (migration.rowCount !== 1) {
  await pool.end();
  throw new Error("Database migrations are incomplete");
}
const { app } = createApp(config, pool);
const log = createLogger();
const server = app.listen(config.PORT, "127.0.0.1", () =>
  log({ level: "info", event: "server.started" }),
);
async function stop() {
  server.close(async () => {
    await pool.end();
    log({ level: "info", event: "server.stopped" });
  });
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
