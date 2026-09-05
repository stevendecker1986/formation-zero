import { test } from "node:test";
import assert from "node:assert/strict";
import { testHarness } from "./helpers.js";
import { template } from "@formation-zero/knowledge/templates";
import {
  PERMISSIONS,
  requiredReviews,
  type Kind,
} from "@formation-zero/knowledge";
import {
  baselineFacts,
  syntheticCandidate,
  syntheticRules,
} from "@formation-zero/rule-engine/fixtures";
import { seedRules } from "../database/seeds/rules.js";
import { importCorpus } from "../database/corpus/import.js";
test("Phase C PostgreSQL/API lifecycle, production boundary and private provenance", async (t) => {
  const h = await testHarness();
  t.after(h.close);
  const password = "Synthetic-Rule-Testing-Password-82!";
  const editor = await h.register("rule-editor@example.invalid", password),
    publisher = await h.register("rule-publisher@example.invalid", password),
    user = await h.register("rule-user@example.invalid", password);
  const ec = (await h.login("rule-editor@example.invalid", password)).cookie,
    pc = (await h.login("rule-publisher@example.invalid", password)).cookie,
    uc = (await h.login("rule-user@example.invalid", password)).cookie;
  await h.pool.query(
    "INSERT INTO user_roles(user_id,role) VALUES($1,'PLATFORM_ADMIN')",
    [publisher],
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
  async function create(kind: Kind, data: Record<string, unknown>) {
    return call(
      "records",
      { kind, data: { ...template(kind), ...data } },
      ec,
      201,
    );
  }
  const seeded = await seedRules(h.pool, "TEST");
  assert.equal(await seedRules(h.pool, "TEST"), seeded);
  await assert.rejects(seedRules(h.pool, "PRODUCTION"));
  const candidate = Object.fromEntries(
    Object.entries(syntheticCandidate()).filter(
      ([key]) =>
        ![
          "synthetic",
          "production_eligible",
          "status",
          "content_version",
        ].includes(key),
    ),
  );
  const input = {
    mode: "TEST",
    rule_set_version: seeded,
    as_of: "2026-09-05",
    facts: {
      ...baselineFacts,
      "readiness.reasons": ["SYNTHETIC_PRIVATE_FACT_MARKER"],
    },
    candidates: [candidate],
  };
  await t.test(
    "USER denied; admin cannot activate without publisher grant",
    async () => {
      await call("rule-evaluations", input, uc, 403);
      await call(
        "rule-activations",
        { rule_set_version: seeded, reason: "Synthetic activation denial" },
        pc,
        403,
      );
      await call("rule-evaluations", input, undefined, 403);
      const r = await h.request("/api/v1/knowledge/rule-evaluations", input);
      assert.equal(r.status, 401);
      for (const permission of PERMISSIONS)
        await call(
          "grants",
          {
            user_id: permission === "PUBLISHER" ? publisher : editor,
            permission,
            enabled: true,
          },
          pc,
        );
    },
  );
  await t.test(
    "synthetic exact set evaluation, forgery rejection and provenance minimization",
    async () => {
      const first = await call("rule-evaluations", input),
        second = await call("rule-evaluations", input);
      assert.deepEqual(first.material, second.material);
      assert.equal(first.material.results[0].eligible, true);
      await call(
        "rule-evaluations",
        { ...input, candidates: [{ ...candidate, production_eligible: true }] },
        ec,
        400,
      );
      await call("rule-evaluations", { ...input, active: true }, ec, 400);
      await call(
        "rule-evaluations",
        { mode: "PRODUCTION", as_of: input.as_of, facts: {}, candidates: [] },
        ec,
        409,
      );
      await call(
        "rule-evaluations",
        {
          mode: "PRODUCTION",
          rule_set_version: seeded,
          as_of: input.as_of,
          facts: {},
          candidates: [],
        },
        ec,
        400,
      );
      await call(
        "rule-activations",
        { rule_set_version: seeded, reason: "Synthetic cannot activate" },
        pc,
        409,
      );
      const stored = await call("rule-evaluations/" + first.record_id);
      assert.equal("facts" in stored.provenance, false);
      const row = (
        await h.pool.query("SELECT * FROM rule_evaluations WHERE id=$1", [
          first.record_id,
        ])
      ).rows[0];
      assert.notEqual(row.input_fingerprint, first.material.input_hash);
      assert.equal(
        JSON.stringify(row).includes("SYNTHETIC_PRIVATE_FACT_MARKER"),
        false,
      );
      assert.equal(
        JSON.stringify(first).includes("SYNTHETIC_PRIVATE_FACT_MARKER"),
        false,
      );
      assert.equal(
        h.logs.join("").includes("SYNTHETIC_PRIVATE_FACT_MARKER"),
        false,
      );
      assert.equal(JSON.stringify(row).includes('"safety.pain"'), false);
      await call("rule-evaluations/" + first.record_id, undefined, pc, 404);
      assert.ok(!h.logs.join("").includes("readiness.state"));
      assert.ok(!h.logs.join("").includes("safety.pain"));
      await assert.rejects(
        h.pool.query("DELETE FROM rule_evaluations WHERE id=$1", [
          first.record_id,
        ]),
        /immutable/,
      );
    },
  );
  const author = await create("AUTHOR", { platform_user_id: editor });
  const reviewer = await create("REVIEWER", {
    person: author.id,
    user_id: editor,
    review_types: ["TECHNICAL", "SAFETY", "EDITORIAL", "RIGHTS"],
    active: true,
  });
  const rights = await create("RIGHTS", {
    classification: "FORMATION_ZERO_ORIGINAL",
    commercial_use_allowed: true,
  });
  async function review(v: { id: string }, type: string) {
    await call("versions/" + v.id + "/reviews", {
      reviewer: reviewer.id,
      type,
      decision: "APPROVE",
      comments:
        "SYNTHETIC isolated integration-test review, not a real approval.",
    });
  }
  async function transition(
    id: string,
    action: string,
    cookie = pc,
    target: string | null = null,
    expected = 200,
  ) {
    const v = await call("versions/" + id);
    return call(
      "versions/" + id + "/transitions",
      {
        action,
        expected_revision: v.revision,
        target,
        reason: "Synthetic integration-test lifecycle",
      },
      cookie,
      expected,
    );
  }
  async function publish(v: {
    id: string;
    kind: Kind;
    payload: Record<string, unknown>;
  }) {
    for (const type of requiredReviews(v.kind, v.payload.provenance))
      await review(v, type);
    await transition(v.id, "APPROVE");
    return transition(v.id, "PUBLISH");
  }
  await review(rights, "RIGHTS");
  const authored = {
    author: author.id,
    rights: rights.id,
    synthetic: false,
    name: "SYNTHETIC isolated production-boundary fixture",
  };
  const reason = await create("REASON_CODE", {
    ...authored,
    reason: {
      category: "SAFETY",
      severity: "INFO",
      explanation: "Synthetic boundary test only.",
    },
  });
  await publish(reason);
  const definition = {
    ...syntheticRules[12]!,
    condition: { op: "EXISTS" as const, path: "candidate.status" },
    effects: [{ type: "ADD_REASON" }],
    type: "INFORMATIONAL",
  };
  const {
    priority,
    type,
    condition,
    effects,
    effective_from,
    effective_until,
    population,
    unknown_behavior,
  } = definition;
  const rule = await create("RULE", {
    ...authored,
    reason_code: reason.id,
    definition: {
      priority,
      type,
      condition,
      effects,
      effective_from,
      effective_until,
      population,
      unknown_behavior,
    },
  });
  let set: typeof rule;
  await t.test(
    "rules require real gates; clients cannot forge state; four eyes preserved",
    async () => {
      await call(
        "records",
        { kind: "RULE", data: { ...rule.payload, status: "PUBLISHED" } },
        ec,
        400,
      );
      await transition(rule.id, "APPROVE", pc, null, 409);
      const draftSet = await create("RULE_SET", {
        ...authored,
        rules: [rule.id],
      });
      await transition(draftSet.id, "APPROVE", pc, null, 409);
      for (const type of requiredReviews("RULE", rule.payload.provenance))
        await review(rule, type);
      await call(
        "grants",
        { user_id: editor, permission: "PUBLISHER", enabled: true },
        pc,
      );
      await transition(rule.id, "APPROVE", ec, null, 409);
      await call(
        "grants",
        { user_id: editor, permission: "PUBLISHER", enabled: false },
        pc,
      );
      await transition(rule.id, "APPROVE");
      await transition(rule.id, "PUBLISH");
      await assert.rejects(
        h.pool.query("UPDATE kb_versions SET title='tamper' WHERE id=$1", [
          rule.id,
        ]),
        /immutable/,
      );
      set = await create("RULE_SET", { ...authored, rules: [rule.id] });
      await publish(set);
      await call(
        "rule-activations",
        {
          rule_set_version: set.id,
          reason: "Synthetic test production activation",
        },
        ec,
        403,
      );
      await call(
        "rule-activations",
        {
          rule_set_version: set.id,
          reason: "Synthetic test production activation",
        },
        pc,
        201,
      );
      assert.equal(
        (await call("rule-activations"))[0].rule_set_version,
        set.id,
      );
      await assert.rejects(
        h.pool.query("DELETE FROM rule_activations"),
        /immutable/,
      );
    },
  );
  await t.test(
    "actual B2 corpus stays excluded under an active production set",
    async () => {
      await importCorpus(h.pool);
      const id = (
        await h.pool.query(
          "SELECT initial_version_id FROM kb_corpus_members WHERE member_key='exercise-001'",
        )
      ).rows[0].initial_version_id;
      const result = await call("rule-evaluations", {
        mode: "PRODUCTION",
        as_of: input.as_of,
        facts: {
          ...baselineFacts,
          "readiness.reasons": ["SYNTHETIC_PRIVATE_FACT_MARKER"],
        },
        candidates: [id],
      });
      assert.equal(result.material.outcome, "NO_SAFE_ELIGIBLE_OPTION");
      assert.equal(result.material.results[0].eligible, false);
      assert.ok(
        result.material.results[0].reasons.some(
          (r: { code: string }) => r.code === "FZ-RSN-CONTENT-NOT-ELIGIBLE",
        ),
      );
      assert.equal(
        (
          await h.pool.query(
            "SELECT count(*)::int n FROM kb_corpus_members cm JOIN kb_states s ON s.version_id=cm.initial_version_id WHERE s.status='PUBLISHED'",
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await t.test(
    "new versions preserve exact references; supersede and retire invalidate active sets",
    async () => {
      const replacement = await call(
        "versions/" + rule.id + "/versions",
        {
          expected_version: 1,
          data: {
            ...rule.payload,
            definition: { ...rule.payload.definition, priority: 11 },
          },
        },
        ec,
        201,
      );
      assert.equal(replacement.code, rule.code);
      assert.equal(replacement.version, 2);
      assert.deepEqual((await call("versions/" + set.id)).payload.rules, [
        rule.id,
      ]);
      await publish(replacement);
      await transition(rule.id, "SUPERSEDE", pc, replacement.id);
      await call(
        "rule-evaluations",
        {
          mode: "PRODUCTION",
          as_of: input.as_of,
          facts: {
            ...baselineFacts,
            "readiness.reasons": ["SYNTHETIC_PRIVATE_FACT_MARKER"],
          },
          candidates: [],
        },
        ec,
        409,
      );
      await transition(replacement.id, "RETIRE");
      await call(
        "versions/" + reason.id + "/versions",
        { expected_version: 1, data: { ...reason.payload, synthetic: true } },
        ec,
        409,
      );
      assert.ok(
        (
          await h.pool.query(
            "SELECT action FROM audit_events WHERE action='knowledge.rule_set.activated'",
          )
        ).rowCount,
      );
      assert.ok(
        (
          await h.pool.query(
            "SELECT action FROM audit_events WHERE action='knowledge.lifecycle.supersede'",
          )
        ).rowCount,
      );
    },
  );
  assert.ok(user);
});
