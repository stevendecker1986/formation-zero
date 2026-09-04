import { readFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { loadConfig } from "@formation-zero/config";
import { createPool } from "../services/api/src/db.js";
import { createApp } from "../services/api/src/app.js";
import { migrate } from "../database/migrate.js";
import { seed } from "../database/seeds/seed.js";
import type { AccountMail } from "../services/api/src/mail.js";
export async function testHarness(
  options: { webOrigin?: string; adminOrigin?: string } = {},
) {
  let connection = process.env.TEST_DATABASE_URL;
  if (!connection) {
    const password = await readFile(".local/database-password", "utf8");
    connection = `postgresql://fz_local:${password}@127.0.0.1:55432/formation_zero_test`;
  }
  const url = new URL(connection);
  if (!url.pathname.endsWith("_test"))
    throw new Error("Test database must end in _test");
  const schema = `test_${randomUUID().replaceAll("-", "")}`;
  const owner = createPool({ DATABASE_URL: connection });
  await owner.query(`CREATE SCHEMA ${schema}`); // generated UUID-only identifier
  url.searchParams.set("options", `-c search_path=${schema}`);
  const config = loadConfig({
    APP_ENV: "TEST",
    DATABASE_URL: url.href,
    AUTH_SECRET: randomBytes(48).toString("hex"),
    API_ORIGIN: "http://localhost:4000",
    WEB_ORIGIN: options.webOrigin ?? "http://localhost:3000",
    ADMIN_ORIGIN: options.adminOrigin ?? "http://localhost:3001",
    MAIL_MODE: "LOCAL",
  });
  const pool = createPool(config);
  const migrations = await migrate(pool);
  await seed(pool, "TEST");
  const mail: AccountMail[] = [];
  const logs: string[] = [];
  const { app, auth } = createApp(config, pool, {
    deliver: async (item) => {
      mail.push(item);
    },
    logSink: (line) => logs.push(line),
  });
  const server = await new Promise<Server>((resolve) => {
    const value = app.listen(0, "127.0.0.1", () => resolve(value));
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing server address");
  const origin = `http://127.0.0.1:${address.port}`;
  async function request(
    path: string,
    body?: unknown,
    cookie?: string,
    method?: string,
    headers: Record<string, string> = {},
  ) {
    return fetch(`${origin}${path}`, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: {
        origin: config.WEB_ORIGIN,
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
    });
  }
  async function resetLimits() {
    await pool.query("DELETE FROM request_limits");
    await pool.query("DELETE FROM auth_rate_limits");
  }
  async function register(email: string, password: string) {
    await resetLimits();
    const response = await request("/api/v1/auth/register", {
      email,
      password,
      name: "Synthetic account",
    });
    if (response.status !== 202)
      throw new Error(`Registration failed: ${response.status}`);
    const token = mail.findLast(
      (item) => item.to === email && item.kind === "verify",
    )?.token;
    if (!token) throw new Error("Missing verification delivery");
    const verified = await request("/api/v1/auth/verify-email", { token });
    if (verified.status !== 200)
      throw new Error(`Verification failed: ${verified.status}`);
    const row = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );
    return row.rows[0]!.id;
  }
  async function login(email: string, password: string) {
    const response = await request("/api/v1/auth/login", { email, password });
    return {
      response,
      cookie: response.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; "),
    };
  }
  async function close() {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await pool.end();
    await owner.query(`DROP SCHEMA ${schema} CASCADE`); // only this randomly generated test schema
    await owner.end();
  }
  return {
    config,
    pool,
    owner,
    schema,
    migrations,
    mail,
    logs,
    auth,
    origin,
    request,
    resetLimits,
    register,
    login,
    close,
  };
}
