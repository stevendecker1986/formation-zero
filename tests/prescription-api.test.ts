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
  const validation = await call(
    "prescription-validations",
    { prescription_record_id: first.record_id },
    ec,
    201,
  );
  await call(
    "prescription-validations",
    { prescription_record_id: first.record_id, status: "PASS" },
    ec,
    400,
  );
  await call(
    "prescription-validations",
    { prescription_record_id: first.record_id, policy_version: "forged" },
    ec,
    400,
  );
  await call("validation-policies", undefined, uc, 403);
  await call(
    "validation-policies",
    {
      version: "FORGED",
      status: "ACTIVE",
      synthetic: false,
      production_eligible: true,
      allowed_prescription_engines: ["1.0.0"],
      allowed_rule_engines: ["1.0.0"],
      approved_nonblocking_codes: [],
    },
    ec,
    403,
  );
  assert.ok(
    ["PASS", "WARN"].includes(validation.material.status),
    JSON.stringify(validation.material),
  );
  assert.equal(validation.material.rejection_reasons.length, 0);
  assert.equal(JSON.stringify(validation).includes("RX_PRIVATE_MARKER"), false);
  const sealed = (
    await h.pool.query<{
      validation_input: Buffer;
      artifact_fingerprint: string;
    }>(
      "SELECT validation_input,artifact_fingerprint FROM prescriptions WHERE id=$1",
      [first.record_id],
    )
  ).rows[0]!;
  assert.ok(Buffer.isBuffer(sealed.validation_input));
  assert.equal(sealed.validation_input.includes("RX_PRIVATE_MARKER"), false);
  assert.match(sealed.artifact_fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(
    (await call("prescription-validations/" + validation.record_id)).status,
    validation.material.status,
  );
  await call(
    "prescriptions/" + first.record_id + "/delivery",
    undefined,
    ec,
    409,
  );
  await call(
    "prescription-validations/" + validation.record_id,
    undefined,
    uc,
    403,
  );
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
  await call(
    "prescription-validations/" + validation.record_id,
    undefined,
    uc,
    404,
  );
  for (const sql of [
    "UPDATE prescriptions SET material='{}'",
    "DELETE FROM prescriptions",
    "TRUNCATE prescriptions",
    "UPDATE prescription_validations SET result='{}'",
    "DELETE FROM prescription_validations",
    "TRUNCATE prescription_validations",
  ])
    await assert.rejects(h.pool.query(sql), /immutable|foreign key constraint/);
  assert.equal(
    (
      await h.pool.query(
        "SELECT count(*)::int n FROM audit_events WHERE action LIKE '%prescription%'",
      )
    ).rows[0].n,
    0,
  );
});
