// Isolated software simulations. No professional review, publication or training advice.
import {
  syntheticRule,
  syntheticRules,
  syntheticCandidate,
  baselineFacts,
  eq,
  and,
} from "@formation-zero/rule-engine/fixtures";
import {
  OBJECTIVES,
  type Construction,
  type PoolCandidate,
  type Template,
  type Dose,
} from "./schemas.js";
export const CATALOG_VERSION = "SYNTHETIC-D-CATALOG-V1";
export const rules = [
  ...syntheticRules.filter((r) => ![7].includes(Number(r.rule_id.slice(-6)))),
  syntheticRule(
    101,
    4,
    eq("readiness.state", "YELLOW"),
    [{ type: "CAP_INTENSITY", value: 2 }],
    "MODIFICATION",
  ),
  syntheticRule(
    102,
    4,
    eq("readiness.state", "ORANGE"),
    [{ type: "CAP_INTENSITY", value: 1 }],
    "MODIFICATION",
  ),
  syntheticRule(
    103,
    4,
    eq("readiness.state", "RED"),
    [{ type: "REQUIRE_RECOVERY" }],
    "REQUIREMENT",
  ),
  syntheticRule(
    104,
    9,
    and(eq("environment.space", "LIMITED"), {
      op: "HAS",
      path: "candidate.tags",
      value: "large_space",
    }),
    [{ type: "BLOCK_CANDIDATE" }],
  ),
  syntheticRule(
    105,
    1,
    and(
      eq("restrictions.jumping_allowed", false),
      eq("candidate.movement", "Jump"),
    ),
    [{ type: "BLOCK_CANDIDATE" }],
  ),
  syntheticRule(
    106,
    1,
    and(eq("restrictions.high_impact_allowed", false), {
      op: "GTE",
      path: "candidate.demand.impact_demand",
      value: 3,
    }),
    [{ type: "BLOCK_CANDIDATE" }],
  ),
  syntheticRule(
    107,
    5,
    and(
      { op: "GTE", path: "load.72h.lower_body", value: 80 },
      { op: "GTE", path: "candidate.demand.lower_body_demand", value: 3 },
    ),
    [{ type: "CAP_INTENSITY", value: 1 }],
    "MODIFICATION",
  ),
  syntheticRule(
    108,
    6,
    eq("program.phase", "Deload"),
    [{ type: "CAP_INTENSITY", value: 1 }],
    "MODIFICATION",
  ),
];
function candidate(
  id: string,
  movement: string,
  changes: Partial<PoolCandidate["content"]> = {},
): PoolCandidate {
  const dose_options: Dose[] = [1, 2, 3].map((level) => ({
    id: "level-" + level,
    volume: { kind: "REPS", sets: level + 1, reps: 10, seconds_per_rep: 4 },
    rest_seconds: 60,
    minimum_rest_seconds: 60,
    setup_seconds: 20,
    transition_seconds: 20,
    intensity: {
      level,
      effort: level === 1 ? "EASY" : level === 2 ? "MODERATE" : "HARD",
      mode: "BODYWEIGHT",
      value: null,
      reference: null,
    },
    objectives: [...OBJECTIVES],
  }));
  return {
    content: syntheticCandidate(id, {
      content_version: "SYNTHETIC-D:" + id + ":1",
      production_eligible: true,
      movement,
      demand: { lower_body_demand: 0, impact_demand: 0, recovery_cost: 1 },
      tags: ["strength"],
      ...changes,
    }),
    kind: "EXERCISE",
    metadata: {
      sections: [
        "PRIMARY",
        "SECONDARY",
        "ACCESSORY",
        "CONDITIONING",
        "MOBILITY",
      ],
      objectives: [...OBJECTIVES],
      prepares_movements: [],
      dose_options,
    },
    relationships: [],
  };
}
const candidates: PoolCandidate[] = [
  candidate("push-a", "Push"),
  candidate("push-b", "Push"),
  candidate("pull", "Pull"),
  candidate("squat", "Squat", {
    demand: { lower_body_demand: 4, impact_demand: 0, recovery_cost: 1 },
  }),
  candidate("hinge", "Hinge"),
  candidate("lunge", "Lunge"),
  candidate("brace", "Brace"),
  candidate("overhead", "Push", { tags: ["overhead", "strength"] }),
  candidate("technical", "Lift", { complexity: 4, supervision_required: true }),
  candidate("jump", "Jump", {
    demand: { impact_demand: 4, lower_body_demand: 3, recovery_cost: 2 },
  }),
  candidate("loaded-push", "Push", { equipment: ["SYNTHETIC-DUMBBELL"] }),
  candidate("run", "Locomotion", {
    capability: "Running",
    tags: ["running", "large_space"],
  }),
  candidate("ruck", "Carry", {
    capability: "Rucking",
    tags: ["rucking"],
    equipment: ["SYNTHETIC-PACK"],
  }),
  candidate("mobility", "Rotation", { capability: "Mobility" }),
  candidate("recover", "Brace", { capability: "Recovery", intensity: 0 }),
  candidate("prepare", "Ground-to-Standing", { intensity: 0 }),
];
for (const c of candidates) {
  if (["run", "ruck"].includes(c.content.id))
    c.metadata.dose_options = [1, 2, 3].map((level) => ({
      id: "continuous-" + level,
      volume: { kind: "TIME", seconds: level * 300 },
      rest_seconds: 0,
      minimum_rest_seconds: 0,
      setup_seconds: 60,
      transition_seconds: 60,
      intensity: {
        level,
        effort: level === 1 ? "EASY" : level === 2 ? "MODERATE" : "HARD",
        mode: "TIME_DISTANCE",
        value: null,
        reference: null,
      },
      objectives: [...OBJECTIVES],
    }));
  if (c.content.id === "recover" || c.content.id === "prepare") {
    c.metadata.dose_options = [
      {
        id: "simple",
        volume: { kind: "TIME", seconds: 120 },
        rest_seconds: 0,
        minimum_rest_seconds: 0,
        setup_seconds: 10,
        transition_seconds: 10,
        intensity: {
          level: 0,
          effort: "EASY",
          mode: "TIME_DISTANCE",
          value: null,
          reference: null,
        },
        objectives: [...OBJECTIVES],
      },
    ];
    if (c.content.id === "recover") {
      c.kind = "RECOVERY";
      c.metadata.sections = ["COOLDOWN", "RECOVERY"];
    } else {
      c.metadata.sections = ["PREPARATION", "WARM_UP", "MOVEMENT_PREP"];
      c.metadata.prepares_movements = [
        "Push",
        "Pull",
        "Squat",
        "Hinge",
        "Lunge",
        "Brace",
        "Locomotion",
        "Carry",
        "Rotation",
        "Lift",
        "Jump",
      ];
    }
  }
  if (c.content.id === "loaded-push")
    c.relationships = [
      { type: "SUBSTITUTION", target_version: "SYNTHETIC-D:push-a:1" },
      { type: "NO_EQUIPMENT", target_version: "SYNTHETIC-D:push-a:1" },
      { type: "REGRESSION", target_version: "SYNTHETIC-D:push-a:1" },
    ];
  if (c.content.id === "push-a")
    c.relationships = [
      { type: "PROGRESSION", target_version: "SYNTHETIC-D:loaded-push:1" },
      { type: "SUBSTITUTION", target_version: "SYNTHETIC-D:push-b:1" },
    ];
}
export const catalog = candidates;
const slot = (
  id: string,
  section: Template["slots"][number]["section"],
  movements: string[],
  required = true,
): Template["slots"][number] => ({
  id,
  section,
  movements,
  required,
  capabilities: [],
  tags: [],
  kind: "ANY",
  minimum_seconds: 1,
  maximum_seconds: 3600,
});
export function fixture(
  objective: Construction["request"]["objective"] = "GENERAL_READINESS",
): Construction {
  const main =
    objective === "RUNNING" || objective === "PFT_PREPARATION"
      ? [slot("run", "PRIMARY", ["Locomotion"])]
      : objective === "RUCKING"
        ? [slot("ruck", "PRIMARY", ["Carry"])]
        : objective === "RECOVERY"
          ? [{ ...slot("recovery", "RECOVERY", []), kind: "RECOVERY" as const }]
          : objective === "MOBILITY"
            ? [slot("mobility", "MOBILITY", ["Rotation"])]
            : [
                slot("push", "PRIMARY", ["Push"]),
                slot("pull", "SECONDARY", ["Pull"]),
                slot("lower", "SECONDARY", ["Squat", "Hinge", "Lunge"]),
                slot("trunk", "ACCESSORY", ["Brace"]),
              ];
  const slots =
    objective === "RECOVERY"
      ? main
      : [
          slot("prepare", "PREPARATION", ["Ground-to-Standing"]),
          ...main,
          {
            ...slot("recovery", "COOLDOWN", [], false),
            kind: "RECOVERY" as const,
          },
        ];
  if (objective === "MUSCLE_DEVELOPMENT")
    slots.splice(
      slots.length - 1,
      0,
      slot("extra-lower", "ACCESSORY", ["Squat", "Hinge", "Lunge"]),
    );
  if (
    ["HYBRID", "TACTICAL_FITNESS", "WORK_CAPACITY", "CFT_PREPARATION"].includes(
      objective,
    )
  )
    slots.splice(
      slots.length - 1,
      0,
      slot("conditioning", "CONDITIONING", ["Locomotion", "Carry", "Jump"]),
    );
  return structuredClone({
    request: {
      mode: "TEST",
      individual_ref: "SYNTHETIC-INDIVIDUAL",
      training_date: "2026-09-05",
      objective,
      duration_seconds: 2700,
      equipment: { available: [], unsafe: [] },
      space: "STANDARD",
      facts: {
        ...baselineFacts,
        "restrictions.jumping_allowed": true,
        "restrictions.high_impact_allowed": true,
        "load.72h.lower_body": 0,
      },
      candidate_scope: [],
      preferences: [],
      emphasis: [],
      relationship_requests: [],
      intensity_inputs: {},
    },
    candidates: catalog,
    template: {
      objective,
      version_id: "SYNTHETIC-D-TEMPLATE:" + objective + ":1",
      synthetic: true,
      production_eligible: true,
      slots,
      buffer_seconds: 60,
      limit_units: {
        running: "WORK_SECONDS",
        rucking: "WORK_SECONDS",
        impact: "WORK_SECONDS",
        lower_body: "WORK_SECONDS",
        upper_body: "WORK_SECONDS",
      },
    },
    rules,
    rule_set_version: "SYNTHETIC-D-RULE-SET:1",
    knowledge_version: CATALOG_VERSION,
  });
}
