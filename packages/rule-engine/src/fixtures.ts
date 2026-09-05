// SYNTHETIC ONLY. These values test software, not physiology or policy.
import {
  type Rule,
  type Candidate,
  type EvaluationInput,
  type Condition,
  type Effect,
} from "./schemas.js";
export const eq = (
  path: string,
  value: string | number | boolean,
): Condition => ({ op: "EQ", path, value });
export const and = (...args: Condition[]): Condition => ({ op: "AND", args });
export function syntheticRule(
  n: number,
  priority: number,
  condition: Condition,
  effects: Effect[],
  type: Rule["type"] = "HARD_BLOCK",
): Rule {
  return {
    rule_id: "FZ-RULE-" + String(n).padStart(6, "0"),
    version: 1,
    version_id: "SYNTHETIC-RULE-V1-" + n,
    status: "INGESTED",
    synthetic: true,
    production_eligible: false,
    provenance: "SYNTHETIC_TEST_ONLY",
    citations: ["synthetic://scenario/" + n],
    priority,
    type,
    condition,
    effects,
    effective_from: "2026-01-01",
    effective_until: null,
    population: null,
    unknown_behavior: "BLOCK",
    reason_version_id: "SYNTHETIC-REASON-V1-" + n,
    reason: {
      code: "FZ-RSN-SYNTHETIC-" + n,
      category: (
        [
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
        ] as const
      )[priority]!,
      explanation: "Synthetic scenario constraint; not training guidance.",
      severity: type === "HARD_BLOCK" ? "BLOCK" : "INFO",
    },
  };
}
const block: Effect[] = [{ type: "BLOCK_CANDIDATE" }];
export const syntheticRules: Rule[] = [
  syntheticRule(
    1,
    0,
    and(eq("safety.pain", true), {
      op: "HAS",
      path: "candidate.tags",
      value: "progression",
    }),
    block,
  ),
  syntheticRule(
    2,
    1,
    and(
      eq("restrictions.running_allowed", false),
      eq("candidate.capability", "Running"),
    ),
    block,
  ),
  {
    ...syntheticRule(
      3,
      2,
      eq("policy.version", "SYNTHETIC-V1"),
      [{ type: "CAP_COMPLEXITY", value: 2 }],
      "MODIFICATION",
    ),
    population: "SYNTHETIC_POPULATION",
    effective_until: "2027-01-01",
  },
  syntheticRule(
    4,
    3,
    { op: "NE", path: "candidate.status", value: "TEST_ONLY" },
    block,
    "ELIGIBILITY",
  ),
  syntheticRule(
    5,
    4,
    and(eq("readiness.state", "RED"), {
      op: "GTE",
      path: "candidate.intensity",
      value: 4,
    }),
    [{ type: "NO_AUTOMATIC_PRESCRIPTION" }],
    "REQUIREMENT",
  ),
  syntheticRule(
    6,
    5,
    and(eq("load.soreness_high", true), {
      op: "GTE",
      path: "candidate.demand.lower_body_demand",
      value: 4,
    }),
    [{ type: "CAP_INTENSITY", value: 1 }],
    "MODIFICATION",
  ),
  syntheticRule(
    7,
    6,
    eq("program.phase", "Deload"),
    [
      { type: "MODIFY_LIMIT", key: "lower_body", value: 2 },
      { type: "REQUIRE_RECOVERY" },
    ],
    "MODIFICATION",
  ),
  syntheticRule(
    8,
    7,
    and(eq("objective", "Strength"), {
      op: "HAS",
      path: "candidate.tags",
      value: "strength",
    }),
    [{ type: "SCORE_UP", value: 2 }],
    "SCORE_ADJUSTMENT",
  ),
  syntheticRule(
    9,
    8,
    and(
      { op: "HAS", path: "movement.exposure", value: "Squat" },
      eq("candidate.movement", "Squat"),
    ),
    [{ type: "SCORE_DOWN", value: 1 }],
    "SCORE_ADJUSTMENT",
  ),
  syntheticRule(
    10,
    9,
    { op: "NOT", arg: { op: "EQUIPMENT_AVAILABLE" } },
    block,
  ),
  syntheticRule(
    11,
    10,
    and(
      { op: "GTE", path: "candidate.complexity", value: 4 },
      eq("formation.supervised", false),
    ),
    block,
  ),
  syntheticRule(
    12,
    11,
    and(
      { op: "HAS", path: "preferences.tags", value: "running" },
      eq("candidate.capability", "Running"),
    ),
    [{ type: "SCORE_UP", value: 50 }],
    "SOFT_PREFERENCE",
  ),
  syntheticRule(
    13,
    12,
    { op: "GTE", path: "optimization.score", value: 0 },
    [{ type: "SCORE_UP", value: 1000 }],
    "SCORE_ADJUSTMENT",
  ),
  syntheticRule(
    14,
    1,
    and(eq("restrictions.overhead_allowed", false), {
      op: "HAS",
      path: "candidate.tags",
      value: "overhead",
    }),
    block,
  ),
  syntheticRule(
    15,
    0,
    and(eq("environment.surface_safe", false), {
      op: "OR",
      args: [
        eq("candidate.movement", "Jump"),
        eq("candidate.movement", "Sprint"),
      ],
    }),
    block,
  ),
  syntheticRule(
    16,
    0,
    and(eq("safety.progression_blocked", true), {
      op: "HAS",
      path: "candidate.tags",
      value: "progression",
    }),
    block,
  ),
  syntheticRule(
    17,
    1,
    and(
      { op: "HAS", path: "restrictions.excluded_movements", value: "Squat" },
      eq("candidate.movement", "Squat"),
    ),
    block,
  ),
  syntheticRule(
    18,
    9,
    and(
      eq("candidate.supervision_required", true),
      eq("formation.supervised", false),
    ),
    block,
  ),
  syntheticRule(
    19,
    6,
    eq("program.phase", "Recovery"),
    [{ type: "REQUIRE_RECOVERY" }, { type: "ADD_REASON" }],
    "INFORMATIONAL",
  ),
];
export const baselineFacts: EvaluationInput["facts"] = {
  "safety.pain": false,
  "safety.progression_blocked": false,
  "restrictions.running_allowed": true,
  "restrictions.overhead_allowed": true,
  "restrictions.excluded_movements": [],
  "policy.population": "GENERAL_SYNTHETIC",
  "policy.version": "NONE",
  "readiness.state": "GREEN",
  "readiness.reasons": [],
  "load.soreness_high": false,
  "program.phase": "Foundation",
  objective: "General Readiness",
  "movement.exposure": [],
  "equipment.available": [],
  "equipment.unsafe": [],
  "environment.surface_safe": true,
  "formation.supervised": true,
  "preferences.tags": [],
  "optimization.score": 0,
};
export function syntheticCandidate(
  id = "synthetic-a",
  changes: Partial<Candidate> = {},
): Candidate {
  return {
    id,
    content_version: "SYNTHETIC:" + id,
    status: "TEST_ONLY",
    synthetic: true,
    production_eligible: false,
    tags: ["eligible"],
    movement: "Brace",
    capability: "Stability",
    complexity: 1,
    intensity: 1,
    equipment: [],
    restrictions: [],
    environment: [],
    supervision_required: false,
    demand: { lower_body_demand: 1 },
    ...changes,
  };
}
export function fixture(
  changes: Partial<EvaluationInput> = {},
): EvaluationInput {
  return {
    mode: "TEST",
    as_of: "2026-09-05",
    rule_set_version: "SYNTHETIC-SET-V1",
    knowledge_version: "SYNTHETIC-KNOWLEDGE-V1",
    facts: baselineFacts,
    candidates: [syntheticCandidate()],
    rules: syntheticRules,
    ...changes,
  };
}
