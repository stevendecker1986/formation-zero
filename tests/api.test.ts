import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { testHarness } from "./helpers.js";
import { migrate } from "../database/migrate.js";
import { seed } from "../database/seeds/seed.js";
import { transaction } from "../services/api/src/db.js";
import { privilegedChange } from "../services/api/src/audit.js";
import { resolveCapabilities } from "@formation-zero/entitlements";
import { TIERS } from "@formation-zero/domain";

test("real PostgreSQL API, authentication and authorization integration", async (t) => {
  const h = await testHarness();
  t.after(h.close);
  const password = "Synthetic-Account-Password-47!";
  let userId = "";
  let adminId = "";
  let userCookie = "";
  await t.test(
    "empty schema migration, seed and rerun are reproducible; test schema is isolated",
    async () => {
      assert.deepEqual(h.migrations, [
        "001_auth.sql",
        "002_foundation.sql",
        "003_account_hardening.sql",
        "004_knowledge.sql",
        "005_controlled_corpus.sql",
      ]);
      assert.deepEqual(await migrate(h.pool), []);
      await seed(h.pool, "TEST");
      assert.equal((await h.pool.query("SELECT * FROM roles")).rowCount, 5);
      assert.equal((await h.pool.query("SELECT * FROM users")).rowCount, 3);
      assert.equal(
        (await h.pool.query("SELECT current_schema() AS name")).rows[0]?.name,
        h.schema,
      );
      for (const tier of TIERS) {
        const rows = await h.pool.query<{ capability: string }>(
          "SELECT capability FROM subscription_entitlements WHERE tier=$1",
          [tier],
        );
        assert.deepEqual(
          rows.rows.map((row) => row.capability).sort(),
          [...resolveCapabilities(tier)].sort(),
        );
      }
    },
  );
  await t.test(
    "health/version, anonymous protected/admin denial, safe invalid JSON and request IDs",
    async () => {
      assert.equal((await h.request("/health")).status, 200);
      assert.equal((await h.request("/api/v1")).status, 200);
      assert.equal((await h.request("/api/v1/account")).status, 401);
      assert.equal((await h.request("/api/v1/admin")).status, 401);
      const response = await h.request("/api/v1/auth/register", {
        email: "bad",
        password: "secret",
      });
      assert.equal(response.status, 400);
      assert.ok(response.headers.get("x-request-id"));
      const text = await response.text();
      assert.ok(!text.includes("secret"));
      assert.ok(!text.includes("stack"));
      const invalid = await fetch(`${h.origin}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          origin: h.config.WEB_ORIGIN,
          "Content-Type": "application/json",
        },
        body: "{",
      });
      assert.equal(invalid.status, 400);
    },
  );
  await t.test(
    "registration succeeds, duplicate rejected without account enumeration; verification one-time",
    async () => {
      const body = {
        email: "user@example.invalid",
        password,
        name: "Synthetic",
      };
      const first = await h.request("/api/v1/auth/register", body);
      const firstBody = await first.json();
      assert.equal(first.status, 202);
      const second = await h.request("/api/v1/auth/register", body);
      assert.equal(second.status, 202);
      assert.deepEqual(await second.json(), firstBody);
      assert.equal(
        (
          await h.pool.query("SELECT id FROM users WHERE email=$1", [
            body.email,
          ])
        ).rowCount,
        1,
      );
      assert.equal((await h.login(body.email, password)).response.status, 401);
      const token = h.mail.find(
        (item) => item.kind === "verify" && item.to === body.email,
      )!.token;
      assert.equal(
        (await h.request("/api/v1/auth/verify-email", { token })).status,
        200,
      );
      assert.equal(
        (await h.request("/api/v1/auth/verify-email", { token })).status,
        400,
      );
      userId = (
        await h.pool.query<{ id: string }>(
          "SELECT id FROM users WHERE email=$1",
          [body.email],
        )
      ).rows[0]!.id;
      const hash = (
        await h.pool.query<{ password: string }>(
          'SELECT password FROM auth_identities WHERE "userId"=$1',
          [userId],
        )
      ).rows[0]!.password;
      assert.notEqual(hash, password);
      assert.ok(hash.length > 64);
    },
  );
  await t.test(
    "login failure/success, protected account default USER/BASE, secure cookie",
    async () => {
      await h.resetLimits();
      const bad = await h.login("user@example.invalid", "Wrong-Password-47!");
      const unknown = await h.login(
        "absent@example.invalid",
        "Wrong-Password-47!",
      );
      assert.equal(bad.response.status, 401);
      assert.equal(unknown.response.status, 401);
      const good = await h.login("user@example.invalid", password);
      assert.equal(good.response.status, 200);
      userCookie = good.cookie;
      assert.ok(good.response.headers.get("set-cookie")?.includes("HttpOnly"));
      assert.match(
        good.response.headers.get("set-cookie") ?? "",
        /SameSite=Lax/i,
      );
      const account = await h.request("/api/v1/account", undefined, userCookie);
      assert.equal(account.status, 200);
      const body = await account.json();
      assert.deepEqual(body.roles, ["USER"]);
      assert.equal(body.tier, "BASE");
    },
  );
  await t.test(
    "role/entitlement forgery rejected in registration/profile; forged headers/cookies cannot grant admin",
    async () => {
      for (const extra of [
        { role: "PLATFORM_ADMIN" },
        { tier: "COMMAND" },
        { capabilities: ["CAN_USE_UNIT_PT"] },
        { enabled: true },
      ]) {
        await h.resetLimits();
        assert.equal(
          (
            await h.request("/api/v1/auth/register", {
              email: "forged@example.invalid",
              password,
              name: "Synthetic",
              ...extra,
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await h.request(
              "/api/v1/account/profile",
              { displayName: "Synthetic", ...extra },
              userCookie,
              "PATCH",
            )
          ).status,
          400,
        );
      }
      assert.equal(
        (
          await h.request("/api/v1/admin", undefined, userCookie, "GET", {
            "x-role": "PLATFORM_ADMIN",
            "x-tier": "COMMAND",
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await h.request(
            "/api/v1/admin",
            undefined,
            "role=PLATFORM_ADMIN; tier=COMMAND",
          )
        ).status,
        401,
      );
    },
  );
  await t.test(
    "PLATFORM_ADMIN allowed; privileged role/tier change creates immutable queryable audit",
    async () => {
      adminId = await h.register("admin@example.invalid", password);
      // Test bootstrap only; no public API permits this write.
      await h.pool.query("INSERT INTO user_roles(user_id,role) VALUES($1,$2)", [
        adminId,
        "PLATFORM_ADMIN",
      ]);
      const admin = await h.login("admin@example.invalid", password);
      assert.equal(
        (await h.request("/api/v1/admin", undefined, admin.cookie)).status,
        200,
      );
      const requestId = randomUUID();
      await privilegedChange(
        h.pool,
        { actorId: adminId, requestId, reason: "OPERATOR_AUTHORIZED_CHANGE" },
        userId,
        { tier: "COMMAND" },
      );
      const account = await (
        await h.request("/api/v1/account", undefined, userCookie)
      ).json();
      assert.equal(account.tier, "COMMAND");
      assert.equal(account.capabilities.length, 9);
      assert.equal(
        (await h.request("/api/v1/admin", undefined, userCookie)).status,
        403,
      );
      const event = (
        await h.pool.query("SELECT * FROM audit_events WHERE request_id=$1", [
          requestId,
        ])
      ).rows[0];
      assert.equal(event.actor_id, adminId);
      assert.equal(event.action, "entitlement.changed");
      assert.equal(event.entity_id, userId);
      assert.ok(event.occurred_at);
      await assert.rejects(
        h.pool.query("UPDATE audit_events SET reason=$1", ["rewrite"]),
        /append-only/,
      );
      await assert.rejects(
        h.pool.query("DELETE FROM audit_events"),
        /append-only/,
      );
      await assert.rejects(
        h.pool.query("TRUNCATE audit_events"),
        /append-only/,
      );
      await assert.rejects(
        privilegedChange(
          h.pool,
          {
            actorId: userId,
            requestId: randomUUID(),
            reason: "OPERATOR_AUTHORIZED_CHANGE",
          },
          userId,
          { role: "PLATFORM_ADMIN" },
        ),
        /FORBIDDEN/,
      );
      await privilegedChange(
        h.pool,
        {
          actorId: adminId,
          requestId: randomUUID(),
          reason: "OPERATOR_AUTHORIZED_CHANGE",
        },
        userId,
        { role: "LEADER" },
      );
    },
  );
  await t.test(
    "logout revokes old cookie; expired sessions denied",
    async () => {
      await h.resetLimits();
      assert.equal(
        (await h.request("/api/v1/auth/logout", {}, userCookie)).status,
        200,
      );
      assert.equal(
        (await h.request("/api/v1/account", undefined, userCookie)).status,
        401,
      );
      const logged = await h.login("user@example.invalid", password);
      await h.pool.query(
        'UPDATE auth_sessions SET "expiresAt"=now()-interval \'1 second\' WHERE "userId"=$1',
        [userId],
      );
      assert.equal(
        (await h.request("/api/v1/account", undefined, logged.cookie)).status,
        401,
      );
    },
  );
  await t.test(
    "password reset is generic, expiring, single-use and revokes existing sessions",
    async () => {
      await h.resetLimits();
      const session = await h.login("user@example.invalid", password);
      const known = await h.request("/api/v1/auth/request-password-reset", {
        email: "user@example.invalid",
      });
      const unknown = await h.request("/api/v1/auth/request-password-reset", {
        email: "absent@example.invalid",
      });
      assert.equal(known.status, 202);
      assert.equal(unknown.status, 202);
      assert.deepEqual(await known.json(), await unknown.json());
      const token = h.mail.findLast(
        (item) => item.kind === "reset" && item.to === "user@example.invalid",
      )!.token;
      const nextPassword = "Synthetic-New-Password-58!";
      assert.equal(
        (
          await h.request("/api/v1/auth/reset-password", {
            token,
            newPassword: nextPassword,
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await h.request("/api/v1/auth/reset-password", {
            token,
            newPassword: password,
          })
        ).status,
        400,
      );
      assert.equal(
        (await h.request("/api/v1/account", undefined, session.cookie)).status,
        401,
      );
      assert.equal(
        (await h.login("user@example.invalid", password)).response.status,
        401,
      );
      assert.equal(
        (await h.login("user@example.invalid", nextPassword)).response.status,
        200,
      );
      await h.request("/api/v1/auth/request-password-reset", {
        email: "user@example.invalid",
      });
      const expired = h.mail.findLast((item) => item.kind === "reset")!.token;
      await h.pool.query(
        "UPDATE auth_verifications SET \"expiresAt\"=now()-interval '1 second'",
      );
      assert.equal(
        (
          await h.request("/api/v1/auth/reset-password", {
            token: expired,
            newPassword: password,
          })
        ).status,
        400,
      );
    },
  );
  await t.test(
    "disabled account revokes sessions, blocks login and remains generic",
    async () => {
      await h.resetLimits();
      const current = await h.login(
        "user@example.invalid",
        "Synthetic-New-Password-58!",
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
      assert.equal(
        (await h.request("/api/v1/account", undefined, current.cookie)).status,
        401,
      );
      assert.equal(
        (await h.login("user@example.invalid", "Synthetic-New-Password-58!"))
          .response.status,
        401,
      );
    },
  );
  await t.test(
    "origin protection, request throttling across instances, safe logs and SQL transaction rollback",
    async () => {
      assert.equal(
        (
          await h.request(
            "/api/v1/auth/login",
            { email: "user@example.invalid", password },
            undefined,
            "POST",
            { origin: "https://attacker.invalid" },
          )
        ).status,
        403,
      );
      const missing = await fetch(`${h.origin}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(missing.status, 403);
      await h.resetLimits();
      for (let i = 0; i < 20; i++) await h.request("/api/v1/auth/login", {});
      assert.equal((await h.request("/api/v1/auth/login", {})).status, 429);
      await assert.rejects(
        transaction(h.pool, async (client) => {
          await client.query(
            "UPDATE user_profiles SET display_name=$2 WHERE user_id=$1",
            [userId, "rolled-back"],
          );
          throw new Error("rollback");
        }),
      );
      assert.notEqual(
        (
          await h.pool.query(
            "SELECT display_name FROM user_profiles WHERE user_id=$1",
            [userId],
          )
        ).rows[0]?.display_name,
        "rolled-back",
      );
      const logs = h.logs.join("");
      assert.ok(!logs.includes(password));
      assert.ok(!logs.includes(userCookie));
      assert.ok(!logs.includes("user@example.invalid"));
      for (const item of h.mail) assert.ok(!logs.includes(item.token));
    },
  );
});
