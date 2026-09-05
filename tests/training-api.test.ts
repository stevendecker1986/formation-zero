import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { testHarness } from "./helpers.js";

const password = "Synthetic-Execution-Test-91!";
const baseRequest = (key: string) => ({
  idempotency_key: key,
  demo: true,
  training_date: "2026-09-05",
  objective: "GENERAL_READINESS",
  duration_seconds: 2700,
  equipment: { available: [], unsafe: [] },
  space: "STANDARD",
  restrictions: {},
  preferences: [],
  candidate_scope: [],
});

test("F consumer orchestration, ownership, idempotency and prescribed/actual separation", async (t) => {
  const h = await testHarness();
  t.after(h.close);
  const ownerId = await h.register("execution-owner@example.invalid", password);
  await h.register("execution-other@example.invalid", password);
  const owner = (await h.login("execution-owner@example.invalid", password))
    .cookie;
  const other = (await h.login("execution-other@example.invalid", password))
    .cookie;
  const call = async (
    path: string,
    body: unknown,
    cookie = owner,
    expected = 200,
    method?: string,
  ) => {
    const response = await h.request(
      `/api/v1/training/${path}`,
      body,
      cookie,
      method,
    );
    assert.equal(response.status, expected, await response.clone().text());
    return response.json();
  };
  assert.equal((await h.request("/api/v1/training/sessions")).status, 401);
  const request = baseRequest("request-demo-0001");
  const created = await call("sessions", request, owner, 201);
  assert.equal(created.mode, "DEMO");
  assert.equal(created.synthetic, true);
  assert.equal(created.entitlement_tier, "BASE");
  assert.equal(created.state, "NOT_STARTED");
  assert.match(created.consumer_snapshot.label, /SYNTHETIC DEMO/);
  assert.ok(created.consumer_snapshot.lines.length > 0);
  assert.equal(
    created.consumer_snapshot.lines.every(
      (line: { media: unknown[]; media_state: string }) =>
        line.media.length === 0 && line.media_state === "NO_APPROVED_MEDIA",
    ),
    true,
  );
  assert.equal(JSON.stringify(created).includes('"internal"'), false);
  assert.equal(JSON.stringify(created).includes('"facts"'), false);
  const repeated = await call("sessions", request, owner, 201);
  assert.equal(repeated.id, created.id);
  assert.equal(
    (
      await h.pool.query(
        "SELECT count(*)::int n FROM workout_sessions WHERE actor_id=$1",
        [ownerId],
      )
    ).rows[0].n,
    1,
  );
  assert.equal(
    (
      await h.request(
        `/api/v1/training/sessions/${created.id}`,
        undefined,
        other,
      )
    ).status,
    404,
  );
  await call(
    "sessions",
    { ...baseRequest("forged-request-001"), validation_status: "PASS" },
    owner,
    400,
  );
  await call(
    "sessions",
    { ...baseRequest("forged-request-002"), entitlement_tier: "COMMAND" },
    owner,
    400,
  );

  const prescribedBefore = (
    await h.pool.query(
      "SELECT prescription_snapshot FROM workout_sessions WHERE id=$1",
      [created.id],
    )
  ).rows[0].prescription_snapshot;
  const started = await call(`sessions/${created.id}/transitions`, {
    action: "START",
    expected_version: 0,
    idempotency_key: "transition-start-001",
  });
  assert.equal(started.state, "IN_PROGRESS");
  assert.equal(started.version, 1);
  const startAgain = await call(`sessions/${created.id}/transitions`, {
    action: "START",
    expected_version: 0,
    idempotency_key: "transition-start-001",
  });
  assert.equal(startAgain.version, 1);
  await call(
    `sessions/${created.id}/transitions`,
    {
      action: "PAUSE",
      expected_version: 0,
      idempotency_key: "transition-stale-01",
    },
    owner,
    409,
  );
  const skipped = await call(
    `sessions/${created.id}/actuals`,
    {
      expected_version: 1,
      idempotency_key: "actual-skipped-0001",
      actual: {
        prescribed_line_index: 0,
        item_status: "SKIPPED",
        notes: "PRIVATE_EXECUTION_MARKER",
      },
    },
    owner,
    201,
  );
  assert.equal(skipped.session.version, 2);
  assert.equal(skipped.session.actuals[0].item_status, "SKIPPED");
  const correction = await call(
    `sessions/${created.id}/actuals`,
    {
      expected_version: 2,
      idempotency_key: "actual-correct-0001",
      supersedes_actual_id: skipped.actual_id,
      actual: { prescribed_line_index: 0, item_status: "PARTIAL", reps: 4 },
    },
    owner,
    201,
  );
  assert.equal(correction.session.actuals.length, 2);
  assert.equal(
    correction.session.actuals[1].supersedes_actual_id,
    skipped.actual_id,
  );
  assert.deepEqual(
    (
      await h.pool.query(
        "SELECT prescription_snapshot FROM workout_sessions WHERE id=$1",
        [created.id],
      )
    ).rows[0].prescription_snapshot,
    prescribedBefore,
  );
  assert.equal(h.logs.join("").includes("PRIVATE_EXECUTION_MARKER"), false);
  const completed = await call(`sessions/${created.id}/transitions`, {
    action: "COMPLETE",
    expected_version: 3,
    idempotency_key: "transition-complete-1",
  });
  assert.equal(completed.state, "COMPLETED");
  await call(
    `sessions/${created.id}/transitions`,
    {
      action: "START",
      expected_version: 4,
      idempotency_key: "transition-invalid-01",
    },
    owner,
    409,
  );
  const history = await h.request(
    "/api/v1/training/sessions?status=COMPLETED&limit=10",
    undefined,
    owner,
  );
  assert.equal(history.status, 200);
  assert.equal((await history.json()).length, 1);
  assert.equal(
    (await h.request("/api/v1/training/sessions?limit=10", undefined, other))
      .status,
    200,
  );
  assert.equal(
    (
      await (
        await h.request("/api/v1/training/sessions?limit=10", undefined, other)
      ).json()
    ).length,
    0,
  );
  for (const sql of [
    "UPDATE workout_sessions SET consumer_snapshot='{}'",
    "DELETE FROM workout_actuals",
    "TRUNCATE workout_execution_events",
  ])
    await assert.rejects(h.pool.query(sql), /immutable/);
});

test("F pause/resume, navigation, authorized substitution and safety stop", async (t) => {
  const h = await testHarness();
  t.after(h.close);
  await h.register("execution-flow@example.invalid", password);
  const cookie = (await h.login("execution-flow@example.invalid", password))
    .cookie;
  const call = async (
    path: string,
    body: unknown,
    expected = 200,
    method?: string,
  ) => {
    const response = await h.request(
      `/api/v1/training/${path}`,
      body,
      cookie,
      method,
    );
    assert.equal(response.status, expected, await response.clone().text());
    return response.json();
  };
  const created = await call(
    "sessions",
    {
      ...baseRequest("request-flow-0001"),
      equipment: { available: ["SYNTHETIC-DUMBBELL"], unsafe: [] },
    },
    201,
  );
  let value = await call(`sessions/${created.id}/transitions`, {
    action: "START",
    expected_version: 0,
    idempotency_key: "flow-start-00001",
  });
  value = await call(
    `sessions/${created.id}/position`,
    {
      expected_version: value.version,
      idempotency_key: "flow-position-001",
      line_index: 1,
    },
    200,
    "PATCH",
  );
  assert.equal(value.current_line, 1);
  value = await call(`sessions/${created.id}/transitions`, {
    action: "PAUSE",
    expected_version: value.version,
    idempotency_key: "flow-pause-00001",
  });
  assert.equal(value.state, "PAUSED");
  value = await call(`sessions/${created.id}/transitions`, {
    action: "RESUME",
    expected_version: value.version,
    idempotency_key: "flow-resume-0001",
  });
  assert.equal(value.state, "IN_PROGRESS");
  const relatedIndex = value.consumer_snapshot.lines.findIndex(
    (line: { content_version: string }) =>
      line.content_version === "SYNTHETIC-D:loaded-push:1",
  );
  assert.ok(relatedIndex >= 0);
  const substitution = await call(
    `sessions/${created.id}/substitutions`,
    {
      expected_version: value.version,
      idempotency_key: "flow-substitute-01",
      prescribed_line_index: relatedIndex,
      relationship_type: "SUBSTITUTION",
    },
    201,
  );
  assert.equal(substitution.session.substitutions.length, 1);
  assert.notEqual(
    substitution.session.substitutions[0].replacement_content_version,
    "SYNTHETIC-D:loaded-push:1",
  );
  const stopped = await call(`sessions/${created.id}/safety-changes`, {
    expected_version: substitution.session.version,
    idempotency_key: "flow-safety-stop1",
    kind: "NEW_RESTRICTION",
  });
  assert.equal(stopped.state, "ABANDONED");
  assert.equal(JSON.stringify(stopped).includes("diagnos"), false);
});

test("F production remains fail closed and real B2 state/policy are unchanged", async (t) => {
  const h = await testHarness();
  t.after(h.close);
  await h.register("execution-production@example.invalid", password);
  const cookie = (
    await h.login("execution-production@example.invalid", password)
  ).cookie;
  const body = {
    ...baseRequest("production-closed-1"),
    demo: false,
    template_version: "00000000-0000-4000-8000-000000000001",
  };
  const response = await h.request("/api/v1/training/sessions", body, cookie);
  assert.ok([404, 409].includes(response.status));
  const payload = await response.json();
  assert.ok(
    [
      "NOT_FOUND",
      "UNAVAILABLE_PRODUCTION_CONTENT",
      "SESSION_REQUEST_UNAVAILABLE",
      "CONTENT_NOT_PRODUCTION_ELIGIBLE",
      "RULE_SET_UNAVAILABLE",
    ].includes(payload.error.code),
  );
  assert.equal(
    (
      await h.pool.query(
        "SELECT count(*)::int n FROM validation_policies WHERE status='ACTIVE'",
      )
    ).rows[0].n,
    0,
  );
  assert.equal(
    (
      await h.pool.query(
        "SELECT count(*)::int n FROM kb_states WHERE status='PUBLISHED' AND version_id IN (SELECT initial_version_id FROM kb_corpus_members WHERE corpus='PHASE_B2_INITIAL')",
      )
    ).rows[0].n,
    0,
  );
  assert.equal(
    (
      await h.pool.query(
        "SELECT count(*)::int n FROM workout_sessions WHERE mode='PRODUCTION'",
      )
    ).rows[0].n,
    0,
  );
});

test("F duplicate requests and concurrent state writes resolve safely", async (t) => {
  const h = await testHarness();
  t.after(h.close);
  await h.register("execution-race@example.invalid", password);
  const cookie = (await h.login("execution-race@example.invalid", password))
    .cookie;
  const request = baseRequest("race-request-0001");
  const createdResponses = await Promise.all([
    h.request("/api/v1/training/sessions", request, cookie),
    h.request("/api/v1/training/sessions", request, cookie),
  ]);
  assert.deepEqual(
    createdResponses.map((response) => response.status),
    [201, 201],
  );
  const created = await Promise.all(
    createdResponses.map((response) => response.json()),
  );
  assert.equal(created[0].id, created[1].id);
  const conflictingRequest = await h.request(
    "/api/v1/training/sessions",
    { ...request, duration_seconds: 1800 },
    cookie,
  );
  assert.equal(conflictingRequest.status, 409);
  assert.equal(
    (await conflictingRequest.json()).error.code,
    "IDEMPOTENCY_CONFLICT",
  );
  const startedResponse = await h.request(
    `/api/v1/training/sessions/${created[0].id}/transitions`,
    {
      action: "START",
      expected_version: 0,
      idempotency_key: "race-start-000001",
    },
    cookie,
  );
  assert.equal(startedResponse.status, 200);
  const writes = await Promise.all([
    h.request(
      `/api/v1/training/sessions/${created[0].id}/transitions`,
      {
        action: "PAUSE",
        expected_version: 1,
        idempotency_key: "race-pause-first",
      },
      cookie,
    ),
    h.request(
      `/api/v1/training/sessions/${created[0].id}/transitions`,
      {
        action: "COMPLETE",
        expected_version: 1,
        idempotency_key: "race-complete-two",
      },
      cookie,
    ),
  ]);
  assert.deepEqual(
    writes.map((response) => response.status).sort(),
    [200, 409],
  );
  const state = (
    await h.pool.query(
      "SELECT state,version FROM workout_session_state WHERE session_id=$1",
      [created[0].id],
    )
  ).rows[0];
  assert.equal(state.version, 2);
  assert.ok(["PAUSED", "COMPLETED"].includes(state.state));
});

test("F client boundary excludes authority and sensitive persistent data", async () => {
  const web = await readFile("apps/web/app/training/page.tsx", "utf8");
  const mobile = await readFile("apps/mobile/App.tsx", "utf8");
  const proxy = await readFile(
    "apps/web/app/api/training/[...path]/route.ts",
    "utf8",
  );
  for (const source of [web, mobile]) {
    assert.equal(source.includes("@formation-zero/validation-engine"), false);
    assert.equal(source.includes("@formation-zero/rule-engine"), false);
    assert.equal(source.includes("training_load"), false);
    assert.equal(source.includes("readiness_score"), false);
  }
  assert.match(web, /86400000/);
  assert.match(web, /localStorage\.removeItem\(cacheKey\)/);
  assert.match(proxy, /no-store, private/);
});
