import { test } from "node:test";
import assert from "node:assert/strict";
import { testHarness } from "./helpers.js";
test("D API test authorization, forged fixture rejection, private immutable history", async (t) => {
  const h = await testHarness();
  t.after(h.close);
  const password = "Synthetic-Prescription-Test-82!";
  const editor = await h.register("rx-editor@example.invalid", password);
  await h.register("rx-user@example.invalid", password);
  const ec = (await h.login("rx-editor@example.invalid", password)).cookie,
    uc = (await h.login("rx-user@example.invalid", password)).cookie;
  await h.pool.query(
    "INSERT INTO kb_grants(user_id,permission,granted_by) VALUES($1,'CONTENT_EDITOR',$1)",
    [editor],
  );
  async function call(
    path: string,
    body?: unknown,
    cookie = ec,
    expected = 200,
  ) {
    await h.resetLimits();
    const r = await h.request("/api/v1/knowledge/" + path, body, cookie);
    assert.equal(r.status, expected, await r.clone().text());
    return r.json();
  }
  await call("prescription-fixtures", undefined, uc, 403);
  const catalog = await call("prescription-fixtures");
  const body = {
    mode: "TEST",
    catalog_version: catalog.catalog_version,
    context: {
      ...catalog.default_context,
      facts: {
        ...catalog.default_context.facts,
        "readiness.reasons": ["RX_PRIVATE_MARKER"],
      },
    },
  };
  await call("prescriptions", body, uc, 403);
  await call("prescriptions", { ...body, status: "PUBLISHED" }, ec, 400);
  await call("prescriptions", { ...body, catalog_version: "forged" }, ec, 400);
  await call(
    "prescriptions",
    {
      ...body,
      context: { ...body.context, candidate_scope: ["real-content"] },
    },
    ec,
    400,
  );
  const first = await call("prescriptions", body),
    second = await call("prescriptions", body);
  assert.equal(first.material.outcome, "CANDIDATE_SESSION");
  assert.deepEqual(first.material, second.material);
  const saved = await call("prescriptions/" + first.record_id);
  assert.deepEqual(saved.material, first.material);
  assert.equal(JSON.stringify(saved).includes("RX_PRIVATE_MARKER"), false);
  assert.equal(h.logs.join("").includes("RX_PRIVATE_MARKER"), false);
  assert.equal(JSON.stringify(saved).includes('"facts"'), false);
  await call("prescriptions/" + first.record_id, undefined, uc, 403);
  const other = (
    await h.pool.query("SELECT id FROM users WHERE email=$1", [
      "rx-user@example.invalid",
    ])
  ).rows[0].id;
  await h.pool.query(
    "INSERT INTO kb_grants(user_id,permission,granted_by) VALUES($1,'CONTENT_EDITOR',$2)",
    [other, editor],
  );
  await call("prescriptions/" + first.record_id, undefined, uc, 404);
  for (const sql of [
    "UPDATE prescriptions SET material='{}'",
    "DELETE FROM prescriptions",
    "TRUNCATE prescriptions",
  ])
    await assert.rejects(h.pool.query(sql), /immutable/);
  assert.equal(
    (
      await h.pool.query(
        "SELECT count(*)::int n FROM audit_events WHERE action LIKE '%prescription%'",
      )
    ).rows[0].n,
    0,
  );
});
