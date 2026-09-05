import { test } from "node:test";
import assert from "node:assert/strict";
import {
  prescribe,
  timing,
  constructionSchema,
  type Construction,
  OBJECTIVES,
} from "@formation-zero/prescription-engine";
import { fixture } from "@formation-zero/prescription-engine/fixtures";
const run = (f = fixture()) => prescribe(f);
const success = (f = fixture()) => {
  const r = run(f);
  assert.equal(
    r.outcome,
    "CANDIDATE_SESSION",
    JSON.stringify(r.internal.notes),
  );
  assert.ok(r.session);
  assert.ok(r.session.total_seconds <= f.request.duration_seconds);
  return r.session;
};
const version = (id: string) => "SYNTHETIC-D:" + id + ":1";
const facts = (f: Construction, changes: object) => {
  f.request.facts = { ...f.request.facts, ...changes };
  return f;
};
const equipment = (f: Construction, available: string[]) => {
  f.request.equipment.available = available;
  f.request.facts["equipment.available"] = available;
  return f;
};
test("D golden 01 — 45-minute general strength has preparation and balanced movements", () => {
  const s = success();
  assert.deepEqual(
    s.lines
      .filter((x) => ["PRIMARY", "SECONDARY", "ACCESSORY"].includes(x.section))
      .map((x) => x.slot_id)
      .sort(),
    ["lower", "pull", "push", "trunk"],
  );
});
test("D golden 02 — 30-minute no equipment", () => {
  const f = fixture();
  f.request.duration_seconds = 1800;
  success(f);
});
test("D golden 03 — 60-minute muscle development", () => {
  const f = fixture("MUSCLE_DEVELOPMENT");
  f.request.duration_seconds = 3600;
  assert.ok(success(f).lines.some((x) => x.slot_id === "extra-lower"));
});
test("D golden 04 — running focus allowed", () =>
  assert.ok(
    success(fixture("RUNNING")).lines.some(
      (x) => x.content_version === version("run"),
    ),
  ));
test("D golden 05 — requested running blocked", () => {
  const r = run(
    facts(fixture("RUNNING"), { "restrictions.running_allowed": false }),
  );
  assert.notEqual(r.outcome, "CANDIDATE_SESSION");
  assert.ok(
    r.internal.base?.results.find((x) => x.content_version === version("run"))
      ?.blocked,
  );
});
test("D golden 06 — synthetic rucking", () => {
  success(equipment(fixture("RUCKING"), ["SYNTHETIC-PACK"]));
});
test("D golden 07 — YELLOW modifies dose through C", () =>
  assert.ok(
    success(facts(fixture(), { "readiness.state": "YELLOW" })).lines.every(
      (x) => x.dose.intensity.level <= 2,
    ),
  ));
test("D golden 08 — ORANGE reduces through C", () =>
  assert.ok(
    success(facts(fixture(), { "readiness.state": "ORANGE" })).lines.every(
      (x) => x.dose.intensity.level <= 1,
    ),
  ));
test("D golden 09 — RED recovery-only or safe failure", () => {
  assert.notEqual(
    run(facts(fixture(), { "readiness.state": "RED" })).outcome,
    "CANDIDATE_SESSION",
  );
  assert.ok(
    success(
      facts(fixture("RECOVERY"), { "readiness.state": "RED" }),
    ).lines.every((x) => x.section === "RECOVERY"),
  );
});
test("D golden 10 — equipment loss uses explicit substitution", () => {
  const f = fixture();
  f.request.relationship_requests = [
    { from_version: version("loaded-push"), type: "SUBSTITUTION" },
  ];
  assert.ok(
    success(f).lines.some(
      (x) =>
        x.content_version === version("push-a") &&
        x.selection_reasons.includes("EXPLICIT_RELATIONSHIP"),
    ),
  );
});
test("D golden 11 — limited space excludes large-space running", () => {
  const f = fixture("HYBRID");
  f.request.space = "LIMITED";
  assert.ok(
    success(f).lines.every((x) => x.content_version !== version("run")),
  );
});
test("D golden 12 — overhead restriction survives preferences", () => {
  const f = facts(fixture(), { "restrictions.overhead_allowed": false });
  f.request.preferences = [version("overhead")];
  assert.ok(
    success(f).lines.every((x) => x.content_version !== version("overhead")),
  );
});
test("D golden 13 — jumping/high-impact restrictions", () => {
  const f = facts(fixture("HYBRID"), {
    "restrictions.jumping_allowed": false,
    "restrictions.high_impact_allowed": false,
  });
  assert.ok(
    success(f).lines.every((x) => x.content_version !== version("jump")),
  );
});
test("D golden 14 — supplied high recent lower-body load caps candidate dose", () => {
  const f = facts(fixture(), { "load.72h.lower_body": 90 });
  f.request.emphasis = ["Squat"];
  assert.ok(
    success(f)
      .lines.filter((x) => x.content_version === version("squat"))
      .every((x) => x.dose.intensity.level <= 1),
  );
  assert.ok(
    run(f).internal.doses.some(
      (x) => x.content_version === version("squat") && !x.decision.eligible,
    ),
  );
});
test("D golden 15 — technical candidate blocked without supervision", () => {
  const f = facts(fixture(), { "formation.supervised": false });
  assert.ok(
    run(f).internal.base?.results.find(
      (x) => x.content_version === version("technical"),
    )?.blocked,
  );
  success(f);
});
test("D golden 16 — preference breaks equal eligible choices", () => {
  const f = fixture();
  f.request.preferences = [version("push-b")];
  assert.ok(
    success(f).lines.some((x) => x.content_version === version("push-b")),
  );
});
test("D golden 17 — preference cannot resurrect blocked equipment candidate", () => {
  const f = fixture();
  f.request.preferences = [version("loaded-push")];
  assert.ok(
    success(f).lines.every((x) => x.content_version !== version("loaded-push")),
  );
});
test("D golden 18 — insufficient time never truncates required components", () => {
  const f = fixture();
  f.request.duration_seconds = 60;
  assert.equal(run(f).outcome, "INSUFFICIENT_TIME");
});
test("D golden 19 — no safe content", () => {
  const f = facts(fixture("RUNNING"), {
    "restrictions.running_allowed": false,
  });
  f.request.candidate_scope = [version("run")];
  assert.equal(run(f).outcome, "NO_SAFE_PRESCRIPTION");
});
test("D golden 20 — unpublished candidate fails production gate", () => {
  const f = fixture();
  f.request.mode = "PRODUCTION";
  f.template.synthetic = false;
  f.rules = f.rules.map((x) => ({
    ...x,
    synthetic: false,
    status: "PUBLISHED",
    production_eligible: true,
  }));
  f.candidates = f.candidates.map((x) => ({
    ...x,
    content: {
      ...x.content,
      synthetic: false,
      status: "INGESTED",
      production_eligible: false,
    },
  }));
  assert.equal(run(f).outcome, "CONTENT_NOT_PRODUCTION_ELIGIBLE");
});
test("D golden 21 — identical repeats", () => assert.deepEqual(run(), run()));
test("D golden 22 — shuffled candidates/rules/doses/slots stable", () => {
  const f = fixture();
  const expected = run(f);
  f.candidates.reverse();
  f.rules.reverse();
  f.template.slots.reverse();
  f.candidates.forEach((x) => x.metadata.dose_options.reverse());
  assert.deepEqual(run(f), expected);
});
test("D golden 23 — exact historical versions remain in prior result", () => {
  const f = fixture();
  const old = run(f);
  const saved = structuredClone(old);
  f.candidates[0]!.content.content_version += "new";
  f.rules[0]!.version++;
  run(f);
  assert.deepEqual(old, saved);
  assert.ok(old.provenance?.rule_versions.length);
});
test("D golden 24 — objective structures differ", () =>
  assert.notDeepEqual(
    success(fixture("RUNNING")).lines.map((x) => x.slot_id),
    success(fixture("STRENGTH")).lines.map((x) => x.slot_id),
  ));
test("D failures, isolation, metadata bounds and no dose-based resurrection", () => {
  assert.equal(prescribe({}).outcome, "INVALID_REQUEST");
  const f = fixture();
  f.rules = [];
  assert.equal(run(f).outcome, "RULE_SET_UNAVAILABLE");
  const missing = fixture();
  missing.request.candidate_scope = ["absent"];
  assert.equal(run(missing).outcome, "INSUFFICIENT_ELIGIBLE_CONTENT");
  const unknown = fixture();
  unknown.request.facts["readiness.state"] = null;
  assert.equal(run(unknown).outcome, "REQUIRED_FACT_UNKNOWN");
  const eq = fixture("RUCKING");
  eq.rules = eq.rules.filter(
    (x) => !x.effects.some((e) => e.type === "BLOCK_CANDIDATE"),
  );
  assert.equal(run(eq).outcome, "REQUIRED_EQUIPMENT_UNAVAILABLE");
  const mix = fixture();
  mix.candidates.forEach((x) => (x.content.synthetic = false));
  assert.equal(run(mix).outcome, "CONTENT_NOT_PRODUCTION_ELIGIBLE");
  const invalid = fixture();
  invalid.candidates[0]!.metadata.dose_options[0]!.rest_seconds = 0;
  assert.equal(constructionSchema.safeParse(invalid).success, false);
  const floor = fixture();
  floor.candidates[0]!.content.intensity = 3;
  assert.equal(run(floor).outcome, "INVALID_REQUEST");
});
test("D explicit progression/regression and blocked targets", () => {
  const f = equipment(fixture(), ["SYNTHETIC-DUMBBELL"]);
  f.request.relationship_requests = [
    { from_version: version("push-a"), type: "PROGRESSION" },
  ];
  assert.ok(
    success(f).lines.some((x) => x.content_version === version("loaded-push")),
  );
  equipment(f, []);
  assert.equal(run(f).outcome, "NO_SAFE_PRESCRIPTION");
  f.request.relationship_requests = [
    { from_version: version("loaded-push"), type: "REGRESSION" },
  ];
  assert.ok(
    success(f).lines.some((x) => x.content_version === version("push-a")),
  );
});
test("D volume/rest arithmetic, supplied phase and safe explanation", () => {
  const d = fixture().candidates[0]!.metadata.dose_options[2]!;
  assert.deepEqual(timing(d), { work: 160, rest: 180, total: 380 });
  assert.deepEqual(
    timing({
      ...d,
      volume: { kind: "INTERVALS", rounds: 3, work_seconds: 30 },
    }),
    { work: 90, rest: 120, total: 250 },
  );
  assert.equal(
    timing({
      ...d,
      volume: { kind: "DISTANCE", meters: 100, estimated_seconds: 90 },
    }).work,
    90,
  );
  const f = facts(fixture(), {
    "program.phase": "Deload",
    "readiness.reasons": ["PRIVATE_MARKER"],
  });
  const r = run(f);
  assert.ok(success(f).lines.every((x) => x.dose.intensity.level <= 1));
  assert.ok(!JSON.stringify(r).includes("PRIVATE_MARKER"));
  assert.ok(!r.public_rationale.includes("Deload"));
});
import { syntheticRule, eq } from "@formation-zero/rule-engine/fixtures";
test("D all thirteen objectives and supplied intensity interfaces", () => {
  for (const objective of OBJECTIVES)
    success(
      equipment(fixture(objective), ["SYNTHETIC-PACK", "SYNTHETIC-DUMBBELL"]),
    );
  for (const mode of ["PACE_ZONE", "LOAD", "PERCENTAGE"] as const) {
    const f = fixture("RUNNING");
    const c = f.candidates.find((x) => x.content.id === "run")!;
    c.metadata.dose_options.forEach((d) => {
      d.intensity.mode = mode;
      d.intensity.value = mode === "PERCENTAGE" ? 50 : null;
    });
    assert.equal(run(f).outcome, "REQUIRED_FACT_UNKNOWN");
    f.request.intensity_inputs = {
      pace_zone: "SUPPLIED-ZONE",
      load_target_kg: 5,
      one_rm_reference: "SUPPLIED-REFERENCE",
    };
    const line = success(f).lines.find(
      (x) => x.content_version === version("run"),
    )!;
    assert.equal(
      mode === "PERCENTAGE"
        ? line.dose.intensity.reference
        : line.dose.intensity.value,
      mode === "PERCENTAGE"
        ? "SUPPLIED-REFERENCE"
        : mode === "LOAD"
          ? 5
          : "SUPPLIED-ZONE",
    );
  }
});
test("D explicit C exposure units, minimum budget and expired rule set fail safely", () => {
  const f = fixture("RUNNING");
  f.rules.push(
    syntheticRule(
      200,
      4,
      eq("candidate.capability", "Running"),
      [{ type: "MODIFY_LIMIT", key: "running", value: 300 }],
      "MODIFICATION",
    ),
  );
  assert.ok(
    success(f)
      .lines.filter((x) => x.content_version === version("run"))
      .every((x) => x.work_seconds <= 300),
  );
  delete f.template.limit_units.running;
  assert.equal(run(f).outcome, "REQUIRED_FACT_UNKNOWN");
  const expired = fixture();
  expired.rules.forEach((r) => (r.effective_until = "2026-09-01"));
  assert.equal(run(expired).outcome, "RULE_SET_UNAVAILABLE");
  const conflict = fixture();
  conflict.request.facts["equipment.available"] = ["forged"];
  assert.equal(run(conflict).outcome, "INVALID_REQUEST");
});
