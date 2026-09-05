import { z } from "zod";
import {
  candidateSchema,
  factsSchema,
  runtimeRuleSchema,
} from "@formation-zero/rule-engine/schemas";
export const OBJECTIVES = [
  "GENERAL_READINESS",
  "STRENGTH",
  "MUSCLE_DEVELOPMENT",
  "RUNNING",
  "RUCKING",
  "HYBRID",
  "TACTICAL_FITNESS",
  "WORK_CAPACITY",
  "MOBILITY",
  "RECOVERY",
  "PFT_PREPARATION",
  "CFT_PREPARATION",
  "CUSTOM",
] as const;
export const SECTIONS = [
  "PREPARATION",
  "WARM_UP",
  "MOVEMENT_PREP",
  "PRIMARY",
  "SECONDARY",
  "ACCESSORY",
  "CONDITIONING",
  "MOBILITY",
  "COOLDOWN",
  "RECOVERY",
] as const;
export const FAILURES = [
  "NO_SAFE_PRESCRIPTION",
  "INSUFFICIENT_ELIGIBLE_CONTENT",
  "INSUFFICIENT_TIME",
  "REQUIRED_EQUIPMENT_UNAVAILABLE",
  "REQUIRED_FACT_UNKNOWN",
  "CONTENT_NOT_PRODUCTION_ELIGIBLE",
  "RULE_SET_UNAVAILABLE",
  "INVALID_REQUEST",
] as const;
const label = z.string().min(1).max(100);
const seconds = z.number().int().min(0).max(14400);
const count = z.number().int().min(1).max(100);
export const volumeSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("REPS"),
      sets: count,
      reps: count,
      seconds_per_rep: z.number().int().min(1).max(60),
    })
    .strict(),
  z
    .object({ kind: z.literal("TIME"), seconds: seconds.refine((v) => v > 0) })
    .strict(),
  z
    .object({
      kind: z.literal("DISTANCE"),
      meters: z.number().int().positive().max(100000),
      estimated_seconds: seconds.refine((v) => v > 0),
    })
    .strict(),
  z
    .object({
      kind: z.literal("INTERVALS"),
      rounds: count,
      work_seconds: seconds.refine((v) => v > 0),
    })
    .strict(),
]);
export const doseSchema = z
  .object({
    id: label,
    volume: volumeSchema,
    rest_seconds: seconds,
    minimum_rest_seconds: seconds,
    setup_seconds: seconds,
    transition_seconds: seconds,
    intensity: z
      .object({
        level: z.number().int().min(0).max(5),
        effort: z.enum(["EASY", "MODERATE", "HARD"]),
        mode: z.enum([
          "BODYWEIGHT",
          "RPE",
          "PERCENTAGE",
          "PACE_ZONE",
          "LOAD",
          "TIME_DISTANCE",
        ]),
        value: z.union([z.number().finite().nonnegative(), label, z.null()]),
        reference: label.nullable(),
      })
      .strict(),
    objectives: z.array(z.enum(OBJECTIVES)).min(1).max(13),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.rest_seconds < v.minimum_rest_seconds)
      ctx.addIssue({ code: "custom", message: "Rest below profile minimum" });
    const i = v.intensity;
    if (
      (i.mode === "RPE" && (typeof i.value !== "number" || i.value > 10)) ||
      (i.mode === "PERCENTAGE" &&
        (typeof i.value !== "number" || i.value > 100))
    )
      ctx.addIssue({ code: "custom", message: "Invalid intensity interface" });
  });
export const prescriptionMetadata = z
  .object({
    sections: z.array(z.enum(SECTIONS)).min(1).max(10),
    objectives: z.array(z.enum(OBJECTIVES)).min(1).max(13),
    prepares_movements: z.array(label).max(30),
    dose_options: z.array(doseSchema).min(1).max(8),
  })
  .strict();
export const relationSchema = z
  .object({
    type: z.enum([
      "REGRESSION",
      "PROGRESSION",
      "SUBSTITUTION",
      "LOW_IMPACT",
      "NO_EQUIPMENT",
      "LIMITED_SPACE",
    ]),
    target_version: label,
  })
  .strict();
export const poolCandidateSchema = z
  .object({
    content: candidateSchema,
    kind: z.enum(["EXERCISE", "RECOVERY"]),
    metadata: prescriptionMetadata,
    relationships: z.array(relationSchema).max(50),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.content.intensity === null ||
      v.metadata.dose_options.some(
        (d) => d.intensity.level < v.content.intensity!,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Dose below known candidate intensity floor",
      });
    if (
      new Set(v.metadata.dose_options.map((d) => d.id)).size !==
      v.metadata.dose_options.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate dose identity" });
  });
export const slotSchema = z
  .object({
    id: label,
    section: z.enum(SECTIONS),
    required: z.boolean(),
    movements: z.array(label).max(30),
    capabilities: z.array(label).max(30),
    tags: z.array(label).max(30),
    kind: z.enum(["EXERCISE", "RECOVERY", "ANY"]),
    minimum_seconds: seconds,
    maximum_seconds: seconds,
  })
  .strict()
  .refine((v) => v.maximum_seconds >= v.minimum_seconds);
export const templateDefinition = z
  .object({
    objective: z.enum(OBJECTIVES),
    slots: z.array(slotSchema).min(1).max(20),
    buffer_seconds: seconds,
    limit_units: z.partialRecord(
      z.enum(["running", "rucking", "impact", "upper_body", "lower_body"]),
      z.literal("WORK_SECONDS"),
    ),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      !v.slots.some((s) => s.required) ||
      new Set(v.slots.map((s) => s.id)).size !== v.slots.length
    )
      ctx.addIssue({ code: "custom", message: "Required unique slots needed" });
  });
export const templateSchema = templateDefinition.safeExtend({
  version_id: label,
  synthetic: z.boolean(),
  production_eligible: z.boolean(),
});
export const requestSchema = z
  .object({
    mode: z.enum(["TEST", "PRODUCTION"]),
    individual_ref: label,
    training_date: z.iso.date(),
    objective: z.enum(OBJECTIVES),
    duration_seconds: seconds.refine((v) => v > 0),
    equipment: z
      .object({
        available: z.array(label).max(100),
        unsafe: z.array(label).max(100),
      })
      .strict(),
    space: z.enum(["STANDARD", "LIMITED", "UNKNOWN"]),
    facts: factsSchema,
    candidate_scope: z.array(label).max(200),
    preferences: z.array(label).max(50),
    emphasis: z.array(label).max(20),
    relationship_requests: z
      .array(
        z
          .object({
            from_version: label,
            type: z.enum(["REGRESSION", "PROGRESSION", "SUBSTITUTION"]),
          })
          .strict(),
      )
      .max(10),
    intensity_inputs: z
      .object({
        pace_zone: label.optional(),
        load_target_kg: z.number().finite().nonnegative().optional(),
        one_rm_reference: label.optional(),
      })
      .strict(),
  })
  .strict();
export const constructionSchema = z
  .object({
    request: requestSchema,
    candidates: z.array(poolCandidateSchema).max(200),
    template: templateSchema,
    rules: z.array(runtimeRuleSchema).max(100),
    rule_set_version: label,
    knowledge_version: label,
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.template.objective !== v.request.objective ||
      new Set(v.candidates.map((c) => c.content.content_version)).size !==
        v.candidates.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Invalid template or candidate identity",
      });
  });
export type Request = z.infer<typeof requestSchema>;
export type Dose = z.infer<typeof doseSchema>;
export type PoolCandidate = z.infer<typeof poolCandidateSchema>;
export type Template = z.infer<typeof templateSchema>;
export type Construction = z.infer<typeof constructionSchema>;
export type Failure = (typeof FAILURES)[number];
export const lineSchema = z
  .object({
    slot_id: label,
    section: z.enum(SECTIONS),
    content_version: label,
    candidate_id: label,
    dose: doseSchema,
    work_seconds: seconds,
    rest_total_seconds: seconds,
    total_seconds: seconds,
    selection_reasons: z.array(label).max(10),
  })
  .strict();
export const sessionSchema = z
  .object({
    objective: z.enum(OBJECTIVES),
    lines: z.array(lineSchema).min(1).max(20),
    sections: z
      .array(
        z
          .object({ section: z.enum(SECTIONS), total_seconds: seconds })
          .strict(),
      )
      .max(10),
    buffer_seconds: seconds,
    total_seconds: seconds,
    unused_seconds: seconds,
  })
  .strict();
