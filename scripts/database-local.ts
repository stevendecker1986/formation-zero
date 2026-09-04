import EmbeddedPostgres from "embedded-postgres";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { randomBytes } from "node:crypto";
await mkdir(".local", { recursive: true });
let password: string;
try {
  password = await readFile(".local/database-password", "utf8");
} catch {
  password = randomBytes(32).toString("hex");
  await writeFile(".local/database-password", password, {
    mode: 0o600,
    flag: "wx",
  });
}
const database = new EmbeddedPostgres({
  databaseDir: ".local/postgres",
  user: "fz_local",
  password,
  port: 55432,
  persistent: true,
  authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {},
  onError: () => {},
});
try {
  await access(".local/postgres/PG_VERSION");
} catch {
  await database.initialise();
}
await database.start();
const client = database.getPgClient("postgres");
await client.connect();
for (const name of ["formation_zero", "formation_zero_test"]) {
  const found = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [name],
  );
  if (!found.rowCount) await client.query(`CREATE DATABASE ${name}`); // fixed identifiers, never user input
}
await client.end();
try {
  await access(".env");
} catch {
  await writeFile(
    ".env",
    `APP_ENV=LOCAL\nDATABASE_URL=postgresql://fz_local:${password}@127.0.0.1:55432/formation_zero\nAUTH_SECRET=${randomBytes(48).toString("base64url")}\nAPI_ORIGIN=http://localhost:4000\nWEB_ORIGIN=http://localhost:3000\nADMIN_ORIGIN=http://localhost:3001\nPORT=4000\nMAIL_MODE=LOCAL\nLEGAL_COMMERCIAL_GATE_APPROVED=false\n`,
    { mode: 0o600, flag: "wx" },
  );
}
process.stdout.write(
  "Local PostgreSQL ready on loopback port 55432. Private .env created if absent. Keep this process running.\n",
);
const keepAlive = setInterval(() => {}, 60_000);
async function stop() {
  clearInterval(keepAlive);
  await database.stop();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
