import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createEmailVerificationToken } from "better-auth/api";
import { testHarness } from "./helpers.js";
import { createApp } from "../services/api/src/app.js";
import { privilegedChange } from "../services/api/src/audit.js";
import { loadConfig } from "@formation-zero/config";

test("additional security and data minimization integration", async (t) => {
  const h = await testHarness();
  t.after(h.close);
  const password = "Synthetic-Security-Password-91!";
  await t.test("expired verification and concurrent replay fail", async () => {
    await h.request("/api/v1/auth/register", {
      email: "verify@example.invalid",
      password,
      name: "Synthetic",
    });
    const expired = await createEmailVerificationToken(
      h.config.AUTH_SECRET,
      "verify@example.invalid",
      undefined,
      -1,
    );
    assert.equal(
      (await h.request("/api/v1/auth/verify-email", { token: expired })).status,
      400,
    );
    const token = h.mail.find(
      (item) => item.to === "verify@example.invalid",
    )!.token;
    const results = await Promise.all([
      h.request("/api/v1/auth/verify-email", { token }),
      h.request("/api/v1/auth/verify-email", { token }),
    ]);
    assert.deepEqual(results.map((result) => result.status).sort(), [200, 400]);
  });
  await t.test(
    "verification requests generic and one reset succeeds under concurrency",
    async () => {
      await h.resetLimits();
      const known = await h.request("/api/v1/auth/send-verification-email", {
        email: "verify@example.invalid",
      });
      const missing = await h.request("/api/v1/auth/send-verification-email", {
        email: "missing@example.invalid",
      });
      assert.equal(known.status, 202);
      assert.deepEqual(await known.json(), await missing.json());
      await h.request("/api/v1/auth/request-password-reset", {
        email: "verify@example.invalid",
      });
      const token = h.mail.findLast((item) => item.kind === "reset")!.token;
      const results = await Promise.all([
        h.request("/api/v1/auth/reset-password", {
          token,
          newPassword: password,
        }),
        h.request("/api/v1/auth/reset-password", {
          token,
          newPassword: password,
        }),
      ]);
      assert.deepEqual(
        results.map((result) => result.status).sort(),
        [200, 400],
      );
    },
  );
  await t.test(
    "database rejects tracking/image fields; safe DB errors never leak secrets",
    async () => {
      const id = (
        await h.pool.query<{ id: string }>(
          "SELECT id FROM users WHERE email=$1",
          ["verify@example.invalid"],
        )
      ).rows[0]!.id;
      await assert.rejects(
        h.pool.query("UPDATE users SET image=$2 WHERE id=$1", [
          id,
          "https://example.invalid/image",
        ]),
      );
      const login = await h.login("verify@example.invalid", password);
      await assert.rejects(
        h.pool.query(
          'UPDATE auth_sessions SET "ipAddress"=$2 WHERE "userId"=$1',
          [id, "127.0.0.1"],
        ),
      );
      await h.pool.query(
        "CREATE FUNCTION deliberate_error() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private-database-detail'; END; $$",
      );
      await h.pool.query(
        "CREATE TRIGGER profile_error BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION deliberate_error()",
      );
      const response = await h.request(
        "/api/v1/account/profile",
        { displayName: "Synthetic" },
        login.cookie,
        "PATCH",
      );
      assert.equal(response.status, 503);
      assert.ok(!(await response.text()).includes("private-database-detail"));
      assert.ok(!h.logs.join("").includes("private-database-detail"));
      await h.pool.query("DROP TRIGGER profile_error ON user_profiles");
    },
  );
  await t.test(
    "throttling survives a second API instance on the same PostgreSQL store",
    async () => {
      await h.resetLimits();
      for (let i = 0; i < 20; i++) await h.request("/api/v1/auth/login", {});
      const { app } = createApp(h.config, h.pool, {
        deliver: async () => {},
        logSink: () => {},
      });
      const server = app.listen(0, "127.0.0.1");
      await new Promise<void>((resolve) => server.once("listening", resolve));
      try {
        const address = server.address();
        assert.ok(address && typeof address !== "string");
        const response = await fetch(
          `http://127.0.0.1:${address.port}/api/v1/auth/login`,
          {
            method: "POST",
            headers: {
              origin: h.config.WEB_ORIGIN,
              "Content-Type": "application/json",
            },
            body: "{}",
          },
        );
        assert.equal(response.status, 429);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    },
  );
  await t.test("audit failure rolls back privilege mutation", async () => {
    const adminId = await h.register("audit-admin@example.invalid", password);
    await h.pool.query("INSERT INTO user_roles(user_id,role) VALUES($1,$2)", [
      adminId,
      "PLATFORM_ADMIN",
    ]);
    const userId = (
      await h.pool.query<{ id: string }>(
        "SELECT id FROM users WHERE email=$1",
        ["verify@example.invalid"],
      )
    ).rows[0]!.id;
    await assert.rejects(
      privilegedChange(
        h.pool,
        {
          actorId: adminId,
          requestId: "invalid-uuid",
          reason: "OPERATOR_AUTHORIZED_CHANGE",
        },
        userId,
        { tier: "COMMAND" },
      ),
    );
    assert.equal(
      (
        await h.pool.query(
          "SELECT tier FROM subscription_accounts WHERE user_id=$1",
          [userId],
        )
      ).rows[0]?.tier,
      "BASE",
    );
    await privilegedChange(
      h.pool,
      {
        actorId: adminId,
        requestId: randomUUID(),
        reason: "OPERATOR_AUTHORIZED_CHANGE",
      },
      userId,
      { enabled: false },
    );
    await assert.rejects(
      h.pool.query(
        'INSERT INTO auth_sessions(id,"expiresAt",token,"createdAt","updatedAt","userId") VALUES($1,now()+interval \'1 day\',$2,now(),now(),$3)',
        [randomUUID(), randomUUID(), userId],
      ),
      /Account unavailable/,
    );
  });
});
test("malformed configuration never leaks input; deployed config requires secure transports", () => {
  const base = {
    APP_ENV: "LOCAL",
    DATABASE_URL: "postgresql://localhost/test",
    AUTH_SECRET: "x".repeat(48),
    API_ORIGIN: "http://localhost:4000",
    WEB_ORIGIN: "http://localhost:3000",
    ADMIN_ORIGIN: "http://localhost:3001",
    MAIL_MODE: "LOCAL",
  };
  for (const key of [
    "DATABASE_URL",
    "API_ORIGIN",
    "WEB_ORIGIN",
    "ADMIN_ORIGIN",
  ])
    assert.throws(
      () => loadConfig({ ...base, [key]: "private-invalid-input" }),
      (error) =>
        error instanceof Error &&
        !error.message.includes("private-invalid-input"),
    );
  const deployed = {
    ...base,
    APP_ENV: "PRODUCTION",
    DATABASE_URL: "postgresql://localhost/test?sslmode=verify-full",
    API_ORIGIN: "https://api.example.invalid",
    WEB_ORIGIN: "https://example.invalid",
    ADMIN_ORIGIN: "https://example.invalid",
    MAIL_MODE: "SMTP",
    SMTP_URL: `smtps://account:${"synthetic"}@mail.example.invalid:465`,
    MAIL_FROM: "test@example.invalid",
  };
  assert.equal(loadConfig(deployed).APP_ENV, "PRODUCTION");
  assert.throws(() =>
    loadConfig({ ...deployed, SMTP_URL: "smtps://mail.example.invalid" }),
  );
});
