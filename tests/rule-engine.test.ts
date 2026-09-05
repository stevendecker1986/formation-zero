import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluate,
  condition,
  PRIORITIES,
  conditionSchema,
  evaluationSchema,
  runtimeRuleSchema,
  type Effect,
} from "@formation-zero/rule-engine";
import {
  fixture,
  syntheticCandidate as candidate,
  syntheticRule as rule,
  baselineFacts,
  syntheticRules,
  eq,
} from "@formation-zero/rule-engine/fixtures";
const first = (input: unknown) => evaluate(input).results[0]!;
const withFacts = (facts: object) => ({ ...baselineFacts, ...facts });
test("golden 01 — no running outranks running preference", () => {
  const r = first(
    fixture({
      facts: withFacts({
        "restrictions.running_allowed": false,
        "preferences.tags": ["running"],
      }),
      candidates: [candidate("run", { capability: "Running" })],
    }),
  );
  assert.equal(r.eligible, false);
  assert.equal(r.blocked, true);
  assert.ok(
    r.trace.some((t) =>
      t.effects.some((e) => e.result === "SUPPRESSED_BLOCKED"),
    ),
  );
});
test("golden 02 — no overhead excludes overhead candidate", () =>
  assert.equal(
    first(
      fixture({
        facts: withFacts({ "restrictions.overhead_allowed": false }),
        candidates: [candidate("overhead", { tags: ["overhead"] })],
      }),
    ).blocked,
    true,
  ));
test("golden 03 — supplied soreness/load limits demanding lower body", () =>
  assert.equal(
    first(
      fixture({
        facts: withFacts({
          "load.soreness_high": true,
          "load.72h.lower_body": 90,
        }),
        candidates: [
          candidate("lower", {
            intensity: 4,
            demand: { lower_body_demand: 4 },
          }),
        ],
      }),
    ).eligible,
    false,
  ));
test("golden 04 — supplied RED withholds strenuous automatic use", () =>
  assert.equal(
    first(
      fixture({
        facts: withFacts({ "readiness.state": "RED" }),
        candidates: [candidate("strenuous", { intensity: 4 })],
      }),
    ).no_automatic_prescription,
    true,
  ));
test("golden 05 — unavailable equipment", () =>
  assert.equal(
    first(
      fixture({
        candidates: [candidate("equipment", { equipment: ["synthetic-bar"] })],
      }),
    ).blocked,
    true,
  ));
test("golden 06 — unsafe surface excludes jumps and sprints", () => {
  for (const movement of ["Jump", "Sprint"])
    assert.equal(
      first(
        fixture({
          facts: withFacts({ "environment.surface_safe": false }),
          candidates: [candidate("surface", { movement })],
        }),
      ).blocked,
      true,
    );
});
test("golden 07 — high complexity without supervision", () =>
  assert.equal(
    first(
      fixture({
        facts: withFacts({ "formation.supervised": false }),
        candidates: [candidate("complex", { complexity: 5 })],
      }),
    ).blocked,
    true,
  ));
test("golden 08 — preference ranks only eligible candidates", () => {
  const r = evaluate(
    fixture({
      facts: withFacts({ "preferences.tags": ["running"] }),
      candidates: [candidate("a"), candidate("z", { capability: "Running" })],
    }),
  );
  assert.deepEqual(r.ranked_eligible, ["z", "a"]);
});
test("golden 09 — exact synthetic policy population and effective interval", () => {
  const input = fixture({
    facts: withFacts({
      "policy.population": "SYNTHETIC_POPULATION",
      "policy.version": "SYNTHETIC-V1",
    }),
    candidates: [candidate("policy", { complexity: 3 })],
  });
  assert.equal(first(input).eligible, false);
  assert.equal(first({ ...input, as_of: "2027-01-01" }).eligible, true);
  assert.equal(first({ ...input, as_of: "2025-12-31" }).eligible, true);
  assert.equal(first({ ...input, facts: baselineFacts }).eligible, true);
  assert.equal(
    evaluate(input).rule_versions.find((r) => r.rule_id === "FZ-RULE-000003")!
      .citations[0],
    "synthetic://scenario/3",
  );
});
test("golden 10 — pending B2 content is not production eligible", () => {
  const r = evaluate(
    fixture({
      mode: "PRODUCTION",
      rules: [
        {
          ...syntheticRules[12]!,
          synthetic: false,
          status: "PUBLISHED",
          production_eligible: true,
        },
      ],
      candidates: [
        candidate("b2", {
          synthetic: false,
          status: "INGESTED",
          production_eligible: false,
        }),
      ],
    }),
  );
  assert.equal(r.outcome, "NO_SAFE_ELIGIBLE_OPTION");
  assert.equal(r.results[0]!.reasons[0]!.code, "FZ-RSN-CONTENT-NOT-ELIGIBLE");
});
test("golden 11 — same priority conflicts use restrictive minimum", () => {
  const rules = [
    rule(
      100,
      6,
      eq("candidate.status", "TEST_ONLY"),
      [{ type: "CAP_INTENSITY", value: 3 }],
      "MODIFICATION",
    ),
    rule(
      101,
      6,
      eq("candidate.status", "TEST_ONLY"),
      [{ type: "CAP_INTENSITY", value: 1 }],
      "MODIFICATION",
    ),
  ];
  const input = fixture({ rules });
  assert.equal(first(input).constraints.intensity!.value, 1);
  assert.deepEqual(
    evaluate(input),
    evaluate({ ...input, rules: [...rules].reverse() }),
  );
  assert.ok(
    first(input).trace.some((t) =>
      t.effects.some((e) => e.result === "SAME_PRIORITY_RESTRICTIVE_MINIMUM"),
    ),
  );
});
test("golden 12 — no safe eligible option is a valid result", () =>
  assert.equal(
    evaluate(
      fixture({
        facts: withFacts({ "safety.pain": true }),
        candidates: [
          candidate("a", { tags: ["progression"] }),
          candidate("b", { tags: ["progression"] }),
        ],
      }),
    ).outcome,
    "NO_SAFE_ELIGIBLE_OPTION",
  ));
test("golden 13 — repeated large set and database order independence", () => {
  const input = fixture({
    candidates: Array.from({ length: 1000 }, (_, i) =>
      candidate("synthetic-" + i),
    ),
  });
  const expected = evaluate(input);
  for (let i = 0; i < 5; i++)
    assert.deepEqual(
      evaluate({
        ...input,
        candidates: [...input.candidates].reverse(),
        rules: [...input.rules].reverse(),
        facts: Object.fromEntries(Object.entries(input.facts).reverse()),
      }),
      expected,
    );
});
test("golden 14 — P12 cannot resurrect a hard-blocked candidate", () => {
  const r = first(
    fixture({
      facts: withFacts({ "safety.pain": true, "optimization.score": 999 }),
      candidates: [candidate("pain", { tags: ["progression"] })],
    }),
  );
  assert.equal(r.blocked, true);
  assert.equal(r.scores[12], 0);
});
test("golden 15 — missing safety facts do not become false", () => {
  const facts = { ...baselineFacts };
  delete facts["safety.pain"];
  const r = first(
    fixture({
      facts,
      candidates: [candidate("unknown", { tags: ["progression"] })],
    }),
  );
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.some((x) => x.code === "FZ-RSN-REQUIRED-FACT-UNKNOWN"));
});
test("golden 16 — unsafe equipment and explicit provider exclusion", () => {
  assert.equal(
    first(
      fixture({
        facts: withFacts({
          "equipment.available": ["bar"],
          "equipment.unsafe": ["bar"],
        }),
        candidates: [candidate("bar", { equipment: ["bar"] })],
      }),
    ).blocked,
    true,
  );
  assert.equal(
    first(
      fixture({
        facts: withFacts({ "restrictions.excluded_movements": ["Squat"] }),
        candidates: [candidate("squat", { movement: "Squat" })],
      }),
    ).blocked,
    true,
  );
});
test("exact priority hierarchy, immutable block and higher-priority limits", () => {
  assert.deepEqual(PRIORITIES, [
    "SAFETY",
    "FUNCTIONAL_RESTRICTIONS",
    "OFFICIAL_POLICY",
    "EXERCISE_ELIGIBILITY",
    "READINESS",
    "RECOVERY_RECENT_LOAD",
    "PROGRAM_PHASE",
    "TRAINING_OBJECTIVE",
    "MOVEMENT_BALANCE",
    "EQUIPMENT_SPACE",
    "FORMATION_LOGISTICS",
    "USER_PREFERENCE",
    "OPTIMIZATION",
  ]);
  assert.equal(new Set(syntheticRules.map((r) => r.priority)).size, 13);
  const rules = [
    rule(
      1,
      0,
      eq("candidate.status", "TEST_ONLY"),
      [{ type: "CAP_INTENSITY", value: 1 }],
      "MODIFICATION",
    ),
    rule(
      2,
      12,
      eq("candidate.status", "TEST_ONLY"),
      [{ type: "CAP_INTENSITY", value: 5 }],
      "MODIFICATION",
    ),
  ];
  assert.equal(first(fixture({ rules })).constraints.intensity!.value, 1);
  assert.equal(
    first(fixture({ rules })).trace[1]!.effects[0]!.result,
    "SUPPRESSED_HIGHER_PRIORITY",
  );
});
test("composable conditions, numeric boundaries, UNKNOWN and bounded syntax", () => {
  const c = candidate(),
    facts = withFacts({ "load.24h.running": 5 });
  for (const op of ["EQ", "GTE", "LTE"] as const)
    assert.equal(
      condition({ op, path: "load.24h.running", value: 5 }, facts, c),
      true,
    );
  for (const op of ["GT", "LT", "NE"] as const)
    assert.equal(
      condition({ op, path: "load.24h.running", value: 5 }, facts, c),
      false,
    );
  assert.equal(
    condition(
      { op: "RANGE", path: "load.24h.running", min: 5, max: 5 },
      facts,
      c,
    ),
    true,
  );
  assert.equal(
    condition({ op: "NOT", arg: eq("load.7d.running", 0) }, facts, c),
    "UNKNOWN",
  );
  assert.equal(
    condition({ op: "MISSING", path: "load.7d.running" }, facts, c),
    true,
  );
  assert.equal(
    condition({ op: "EXISTS", path: "load.24h.running" }, facts, c),
    true,
  );
  assert.equal(
    condition(
      { op: "HAS", path: "candidate.tags", value: "eligible" },
      facts,
      c,
    ),
    true,
  );
  assert.equal(
    condition(
      { op: "OR", args: [eq("load.7d.running", 0), eq("load.24h.running", 5)] },
      facts,
      c,
    ),
    true,
  );
  assert.equal(
    condition(
      {
        op: "AND",
        args: [eq("load.7d.running", 0), eq("load.24h.running", 4)],
      },
      facts,
      c,
    ),
    false,
  );
  assert.throws(() =>
    conditionSchema.parse({ op: "EXECUTE", code: "process.exit()" }),
  );
  assert.throws(() =>
    conditionSchema.parse({
      op: "EQ",
      path: "__proto__.constructor",
      value: 1,
    }),
  );
  let deep: unknown = eq("safety.pain", true);
  for (let i = 0; i < 20; i++) deep = { op: "NOT", arg: deep };
  assert.throws(() => conditionSchema.parse(deep));
  assert.throws(() =>
    evaluationSchema.parse(
      fixture({ facts: { "readiness.state": "CALCULATE" } }),
    ),
  );
});
test("all typed effects produce reasons and constraints without constructing workouts", () => {
  const effects: Effect[] = [
    { type: "BLOCK_CANDIDATE" },
    { type: "REQUIRE_ATTRIBUTE", path: "candidate.movement", value: "Brace" },
    { type: "EXCLUDE_TAG", tag: "unsafe" },
    { type: "REQUIRE_TAG", tag: "eligible" },
    { type: "MODIFY_LIMIT", key: "running", value: 1 },
    { type: "CAP_INTENSITY", value: 1 },
    { type: "CAP_COMPLEXITY", value: 1 },
    { type: "REQUIRE_RECOVERY" },
    { type: "ADD_REASON" },
    { type: "SCORE_UP", value: 2 },
    { type: "SCORE_DOWN", value: 1 },
    { type: "FLAG_REVIEW" },
    { type: "NO_AUTOMATIC_PRESCRIPTION" },
  ];
  for (const effect of effects) {
    const r = first(
      fixture({
        rules: [
          rule(
            1,
            6,
            eq("candidate.status", "TEST_ONLY"),
            [effect],
            effect.type === "BLOCK_CANDIDATE" ? "HARD_BLOCK" : "MODIFICATION",
          ),
        ],
      }),
    );
    assert.equal(r.reasons.length > 0, true);
    assert.equal(r.trace[0]!.effects[0]!.result, "APPLIED");
  }
  const r = evaluate(fixture());
  assert.equal("workout" in r, false);
  assert.equal("facts" in r, false);
  assert.equal(JSON.stringify(r).includes('"readiness.state":"GREEN"'), false);
});
test("test-only isolation, client runtime validation, incompatible attributes and unknown review", () => {
  assert.equal(
    first(fixture({ candidates: [candidate("real", { synthetic: false })] }))
      .eligible,
    false,
  );
  assert.equal(
    first(fixture({ rules: [{ ...syntheticRules[0]!, synthetic: false }] }))
      .eligible,
    false,
  );
  assert.equal(first(fixture({ mode: "PRODUCTION" })).eligible, false);
  const rules = [
    rule(
      1,
      6,
      eq("candidate.status", "TEST_ONLY"),
      [
        {
          type: "REQUIRE_ATTRIBUTE",
          path: "candidate.movement",
          value: "Brace",
        },
      ],
      "REQUIREMENT",
    ),
    rule(
      2,
      6,
      eq("candidate.status", "TEST_ONLY"),
      [
        {
          type: "REQUIRE_ATTRIBUTE",
          path: "candidate.movement",
          value: "Squat",
        },
      ],
      "REQUIREMENT",
    ),
  ];
  assert.equal(first(fixture({ rules })).blocked, true);
  const reviewRule = {
    ...rule(
      3,
      7,
      eq("load.7d.running", 5),
      [{ type: "ADD_REASON" }],
      "INFORMATIONAL",
    ),
    unknown_behavior: "REVIEW" as const,
  };
  assert.equal(
    first(fixture({ rules: [reviewRule] })).no_automatic_prescription,
    true,
  );
});

test("priority ownership, functional constraint facts and score ordering", () => {
  assert.throws(() =>
    runtimeRuleSchema.parse({ ...syntheticRules[11], priority: 0 }),
  );
  assert.throws(() =>
    runtimeRuleSchema.parse({ ...syntheticRules[12], priority: 0 }),
  );
  for (const key of [
    "running_allowed",
    "jumping_allowed",
    "overhead_allowed",
    "loaded_carry_allowed",
    "high_impact_allowed",
    "deep_knee_flexion_allowed",
  ]) {
    const r = rule(300, 1, eq("restrictions." + key, false), [
      { type: "BLOCK_CANDIDATE" },
    ]);
    assert.equal(
      first(fixture({ rules: [r], facts: { ["restrictions." + key]: false } }))
        .blocked,
      true,
    );
    assert.equal(first(fixture({ rules: [r], facts: {} })).eligible, false);
  }
  const r = evaluate(
    fixture({
      facts: withFacts({
        objective: "Strength",
        "preferences.tags": ["running"],
      }),
      candidates: [
        candidate("strength", { tags: ["strength"] }),
        candidate("running", { capability: "Running" }),
      ],
    }),
  );
  assert.deepEqual(r.ranked_eligible, ["strength", "running"]);
  assert.ok(r.rule_versions.every((v) => v.reason_version_id));
});
