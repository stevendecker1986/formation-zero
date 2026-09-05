import { z } from "zod";
export const PRIORITIES = [
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
] as const;
export const TYPES = [
  "HARD_BLOCK",
  "REQUIREMENT",
  "MODIFICATION",
  "ELIGIBILITY",
  "SOFT_PREFERENCE",
  "SCORE_ADJUSTMENT",
  "INFORMATIONAL",
] as const;
export const PHASES = [
  "Baseline",
  "Foundation",
  "Accumulation",
  "Development",
  "Intensification",
  "Performance",
  "Test Preparation",
  "Deload",
  "Recovery",
  "Transition",
  "Rebuild",
] as const;
export const OBJECTIVES = [
  "General Readiness",
  "Strength",
  "Running",
  "Ruck",
  "Hybrid",
  "Tactical Fitness",
  "Work Capacity",
  "Mobility",
  "Recovery",
  "PFT",
  "CFT",
  "Custom",
] as const;
const word = z.string().min(1).max(100);
const scalar = z.union([z.boolean(), z.number().finite(), word]);
export const factValue = z.union([scalar, z.array(word).max(100), z.null()]);
export const FACT_KEYS = [
  "safety.pain",
  "safety.progression_blocked",
  "restrictions.running_allowed",
  "restrictions.jumping_allowed",
  "restrictions.overhead_allowed",
  "restrictions.loaded_carry_allowed",
  "restrictions.high_impact_allowed",
  "restrictions.deep_knee_flexion_allowed",
  "restrictions.excluded_movements",
  "policy.population",
  "policy.version",
  "readiness.state",
  "readiness.reasons",
  "load.soreness_high",
  "program.phase",
  "objective",
  "movement.exposure",
  "equipment.available",
  "equipment.unsafe",
  "environment.surface_safe",
  "environment.space",
  "environment.tags",
  "formation.size",
  "formation.supervised",
  "preferences.tags",
  "optimization.score",
] as const;
const loadKey = z
  .string()
  .regex(
    /^load\.(24h|72h|7d|28d)\.(running|rucking|impact|lower_body|upper_body|high_intensity|aerobic|anaerobic)$/,
  );
export const factsSchema = z
  .record(z.union([z.enum(FACT_KEYS), loadKey]), factValue)
  .superRefine((v, ctx) => {
    for (const [key, value] of Object.entries(v)) {
      if (value === null || value === "UNKNOWN") continue;
      const bad =
        key === "readiness.state"
          ? !["GREEN", "YELLOW", "ORANGE", "RED"].includes(String(value))
          : key === "program.phase"
            ? !(PHASES as readonly unknown[]).includes(value)
            : key === "objective"
              ? !(OBJECTIVES as readonly unknown[]).includes(value)
              : key.endsWith("_allowed") ||
                  [
                    "safety.pain",
                    "safety.progression_blocked",
                    "load.soreness_high",
                    "environment.surface_safe",
                    "formation.supervised",
                  ].includes(key)
                ? typeof value !== "boolean"
                : key.startsWith("load.") ||
                    ["formation.size", "optimization.score"].includes(key)
                  ? typeof value !== "number" || value < 0
                  : [
                        "restrictions.excluded_movements",
                        "readiness.reasons",
                        "movement.exposure",
                        "equipment.available",
                        "equipment.unsafe",
                        "environment.tags",
                        "preferences.tags",
                      ].includes(key)
                    ? !Array.isArray(value)
                    : typeof value !== "string";
      if (bad)
        ctx.addIssue({
          code: "custom",
          message: "Invalid typed fact",
          path: [key],
        });
    }
  });
export const CANDIDATE_KEYS = [
  "candidate.status",
  "candidate.tags",
  "candidate.movement",
  "candidate.capability",
  "candidate.complexity",
  "candidate.intensity",
  "candidate.equipment",
  "candidate.restrictions",
  "candidate.environment",
  "candidate.supervision_required",
] as const;
const pathSchema = z.union([
  z.enum(FACT_KEYS),
  loadKey,
  z.enum(CANDIDATE_KEYS),
  z
    .string()
    .regex(
      /^candidate\.demand\.(muscular_demand|cardiovascular_demand|neurological_demand|impact_demand|upper_body_demand|lower_body_demand|trunk_demand|grip_demand|axial_loading|eccentric_loading|technical_demand|running_interference|rucking_interference|recovery_cost)$/,
    ),
]);
export type Condition =
  | { op: "AND" | "OR"; args: Condition[] }
  | { op: "NOT"; arg: Condition }
  | { op: "EXISTS" | "MISSING"; path: string }
  | {
      op: "EQ" | "NE" | "HAS" | "GT" | "GTE" | "LT" | "LTE";
      path: string;
      value: string | number | boolean;
    }
  | { op: "RANGE"; path: string; min: number; max: number }
  | { op: "EQUIPMENT_AVAILABLE" };
const recursive: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z
      .object({
        op: z.enum(["AND", "OR"]),
        args: z.array(recursive).min(1).max(20),
      })
      .strict(),
    z.object({ op: z.literal("NOT"), arg: recursive }).strict(),
    z.object({ op: z.enum(["EXISTS", "MISSING"]), path: pathSchema }).strict(),
    z
      .object({
        op: z.enum(["EQ", "NE", "HAS", "GT", "GTE", "LT", "LTE"]),
        path: pathSchema,
        value: scalar,
      })
      .strict(),
    z
      .object({
        op: z.literal("RANGE"),
        path: pathSchema,
        min: z.number().finite(),
        max: z.number().finite(),
      })
      .strict()
      .refine((v) => v.min <= v.max),
    z.object({ op: z.literal("EQUIPMENT_AVAILABLE") }).strict(),
  ]),
);
export const conditionSchema = z
  .unknown()
  .superRefine((value, ctx) => {
    let nodes = 0;
    function visit(v: unknown, depth: number): boolean {
      if (++nodes > 200 || depth > 12) return false;
      if (v && typeof v === "object")
        return Object.values(v).every((x) => visit(x, depth + 1));
      return true;
    }
    if (!visit(value, 0))
      ctx.addIssue({ code: "custom", message: "Condition complexity limit" });
  })
  .pipe(recursive);
export const EFFECTS = [
  "BLOCK_CANDIDATE",
  "REQUIRE_ATTRIBUTE",
  "EXCLUDE_TAG",
  "REQUIRE_TAG",
  "MODIFY_LIMIT",
  "CAP_INTENSITY",
  "CAP_COMPLEXITY",
  "REQUIRE_RECOVERY",
  "ADD_REASON",
  "SCORE_UP",
  "SCORE_DOWN",
  "FLAG_REVIEW",
  "NO_AUTOMATIC_PRESCRIPTION",
] as const;
export const effectSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.enum([
        "BLOCK_CANDIDATE",
        "REQUIRE_RECOVERY",
        "ADD_REASON",
        "FLAG_REVIEW",
        "NO_AUTOMATIC_PRESCRIPTION",
      ]),
    })
    .strict(),
  z
    .object({ type: z.enum(["REQUIRE_TAG", "EXCLUDE_TAG"]), tag: word })
    .strict(),
  z
    .object({
      type: z.literal("REQUIRE_ATTRIBUTE"),
      path: pathSchema,
      value: scalar,
    })
    .strict(),
  z
    .object({
      type: z.literal("MODIFY_LIMIT"),
      key: z.enum([
        "intensity",
        "complexity",
        "running",
        "rucking",
        "impact",
        "upper_body",
        "lower_body",
      ]),
      value: z.number().finite().nonnegative().max(100000),
    })
    .strict(),
  z
    .object({
      type: z.enum(["CAP_INTENSITY", "CAP_COMPLEXITY"]),
      value: z.number().int().min(0).max(5),
    })
    .strict(),
  z
    .object({
      type: z.enum(["SCORE_UP", "SCORE_DOWN"]),
      value: z.number().finite().nonnegative().max(1000),
    })
    .strict(),
]);
export type Effect = z.infer<typeof effectSchema>;
export const reasonSchema = z
  .object({
    code: z.string().regex(/^FZ-RSN-[A-Z0-9][A-Z0-9-]{2,90}$/),
    category: z.enum(PRIORITIES),
    explanation: z.string().min(1).max(300),
    severity: z.enum(["INFO", "WARNING", "BLOCK"]),
  })
  .strict();
export const ruleDefinitionSchema = z
  .object({
    priority: z.number().int().min(0).max(12),
    type: z.enum(TYPES),
    condition: conditionSchema,
    effects: z.array(effectSchema).min(1).max(20),
    effective_from: z.iso.date(),
    effective_until: z.iso.date().nullable(),
    population: word.nullable(),
    unknown_behavior: z.enum(["BLOCK", "REVIEW"]),
  })
  .strict()
  .superRefine((v, ctx) => {
    const paths: string[] = [];
    function collect(c: Condition) {
      if ("path" in c) paths.push(c.path);
      if ("args" in c) c.args.forEach(collect);
      if ("arg" in c) collect(c.arg);
    }
    collect(v.condition);
    if (
      (v.type === "SOFT_PREFERENCE" ||
        paths.some((p) => p.startsWith("preferences."))) &&
      v.priority !== 11
    )
      ctx.addIssue({ code: "custom", message: "Preferences belong to P11" });
    if (paths.some((p) => p.startsWith("optimization.")) && v.priority !== 12)
      ctx.addIssue({ code: "custom", message: "Optimization belongs to P12" });
    if (v.effective_until && v.effective_until <= v.effective_from)
      ctx.addIssue({ code: "custom", message: "Invalid effective interval" });
    if (
      v.type === "HARD_BLOCK" &&
      !v.effects.some((e) => e.type === "BLOCK_CANDIDATE")
    )
      ctx.addIssue({
        code: "custom",
        message: "Hard block requires block effect",
      });
  });
export const runtimeRuleSchema = ruleDefinitionSchema.safeExtend({
  rule_id: z.string().regex(/^FZ-RULE-[0-9]{6,}$/),
  version: z.number().int().positive(),
  version_id: word,
  status: word,
  synthetic: z.boolean(),
  production_eligible: z.boolean(),
  provenance: word,
  citations: z.array(word).max(50),
  reason: reasonSchema,
  reason_version_id: word,
});
export type Rule = z.infer<typeof runtimeRuleSchema>;
export const candidateSchema = z
  .object({
    id: word,
    content_version: word,
    status: word,
    synthetic: z.boolean(),
    production_eligible: z.boolean(),
    tags: z.array(word).max(100).nullable(),
    movement: word.nullable(),
    capability: word.nullable(),
    complexity: z.number().int().min(1).max(5).nullable(),
    intensity: z.number().min(0).max(5).nullable(),
    equipment: z.array(word).max(50).nullable(),
    restrictions: z.array(word).max(50).nullable(),
    environment: z.array(word).max(50).nullable(),
    supervision_required: z.boolean().nullable(),
    demand: z.record(
      z.string().regex(/^[a-z_]{1,50}$/),
      z.number().min(0).max(5),
    ),
  })
  .strict();
export type Candidate = z.infer<typeof candidateSchema>;
export const evaluationSchema = z
  .object({
    mode: z.enum(["TEST", "PRODUCTION"]),
    as_of: z.iso.date(),
    rule_set_version: word,
    knowledge_version: word,
    facts: factsSchema,
    candidates: z.array(candidateSchema).max(1000),
    rules: z.array(runtimeRuleSchema).max(100),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      new Set(v.candidates.map((x) => x.id)).size !== v.candidates.length ||
      new Set(v.rules.map((x) => x.rule_id)).size !== v.rules.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Duplicate candidate or rule identity",
      });
  });
export type EvaluationInput = z.infer<typeof evaluationSchema>;
