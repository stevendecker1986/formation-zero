import { z } from "zod";
import {
  candidateSchema,
  factsSchema,
  runtimeRuleSchema,
} from "@formation-zero/rule-engine/schemas";

export const STATUSES = ["PASS", "WARN", "REJECT"] as const;
export const CATEGORIES = [
  "STRUCTURE",
  "SAFETY",
  "FUNCTIONAL_RESTRICTION",
  "POLICY",
  "CONTENT_ELIGIBILITY",
  "RIGHTS_PUBLICATION",
  "DOSE",
  "TIME",
  "MOVEMENT_COMPOSITION",
  "DEMAND",
  "EQUIPMENT",
  "SPACE_ENVIRONMENT",
  "READINESS",
  "RECENT_LOAD",
  "PROGRAM_PHASE",
  "OBJECTIVE_ALIGNMENT",
  "SUBSTITUTION_RELATIONSHIP",
  "SUPERVISION_COMPLEXITY",
  "PROVENANCE",
  "EXPLAINABILITY",
  "INTERNAL_CONSISTENCY",
  "PRIVACY_SECURITY",
] as const;
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
const label = z.string().min(1).max(200);
const number = z.number().finite();
export const independentVolumeSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("REPS"),
      sets: number,
      reps: number,
      seconds_per_rep: number,
    })
    .strict(),
  z.object({ kind: z.literal("TIME"), seconds: number }).strict(),
  z
    .object({
      kind: z.literal("DISTANCE"),
      meters: number,
      estimated_seconds: number,
    })
    .strict(),
  z
    .object({
      kind: z.literal("INTERVALS"),
      rounds: number,
      work_seconds: number,
    })
    .strict(),
]);
export const independentDoseSchema = z
  .object({
    id: label,
    volume: independentVolumeSchema,
    rest_seconds: number,
    minimum_rest_seconds: number,
    setup_seconds: number,
    transition_seconds: number,
    intensity: z
      .object({
        level: number,
        effort: label,
        mode: label,
        value: z.union([number, label, z.null()]),
        reference: label.nullable(),
      })
      .strict(),
    objectives: z.array(label).max(30),
  })
  .strict();
export const lineSchema = z
  .object({
    slot_id: label,
    section: label,
    content_version: label,
    candidate_id: label,
    dose: independentDoseSchema,
    work_seconds: number,
    rest_total_seconds: number,
    total_seconds: number,
    selection_reasons: z.array(label).max(20),
  })
  .strict();
export const sessionSchema = z
  .object({
    objective: label,
    lines: z.array(lineSchema).max(50),
    sections: z
      .array(z.object({ section: label, total_seconds: number }).strict())
      .max(20),
    buffer_seconds: number,
    total_seconds: number,
    unused_seconds: number,
  })
  .strict();
export const prescriptionSchema = z
  .object({
    engine_version: label,
    prescription_id: label.nullable(),
    outcome: label,
    session: sessionSchema.nullable(),
    public_rationale: z.string().max(1000),
    internal: z.unknown(),
    provenance: z
      .object({
        request_fingerprint: label,
        material_fingerprint: label,
        rule_engine_version: label,
        rule_set_version: label,
        rule_versions: z.array(z.record(z.string(), z.unknown())).max(100),
        knowledge_version: label,
        template_version: label,
        content_versions: z.array(label).max(100),
        training_date: label,
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict();
export const requestSchema = z
  .object({
    mode: z.enum(["TEST", "PRODUCTION"]),
    individual_ref: label,
    training_date: z.iso.date(),
    objective: z.enum(OBJECTIVES),
    duration_seconds: number,
    equipment: z
      .object({ available: z.array(label), unsafe: z.array(label) })
      .strict(),
    space: z.enum(["STANDARD", "LIMITED", "UNKNOWN"]),
    facts: factsSchema,
    candidate_scope: z.array(label),
    preferences: z.array(label),
    emphasis: z.array(label),
    relationship_requests: z.array(
      z
        .object({
          from_version: label,
          type: z.enum(["REGRESSION", "PROGRESSION", "SUBSTITUTION"]),
        })
        .strict(),
    ),
    intensity_inputs: z
      .object({
        pace_zone: label.optional(),
        load_target_kg: number.optional(),
        one_rm_reference: label.optional(),
      })
      .strict(),
  })
  .strict();
export const metadataSchema = z
  .object({
    sections: z.array(label),
    objectives: z.array(label),
    prepares_movements: z.array(label),
    dose_options: z.array(independentDoseSchema),
  })
  .strict();
export const poolCandidateSchema = z
  .object({
    content: candidateSchema,
    kind: z.enum(["EXERCISE", "RECOVERY"]),
    metadata: metadataSchema,
    relationships: z.array(
      z.object({ type: label, target_version: label }).strict(),
    ),
  })
  .strict();
export const templateSchema = z
  .object({
    objective: label,
    version_id: label,
    synthetic: z.boolean(),
    production_eligible: z.boolean(),
    slots: z.array(
      z
        .object({
          id: label,
          section: label,
          required: z.boolean(),
          movements: z.array(label),
          capabilities: z.array(label),
          tags: z.array(label),
          kind: label,
          minimum_seconds: number,
          maximum_seconds: number,
        })
        .strict(),
    ),
    buffer_seconds: number,
    limit_units: z.record(z.string(), z.string()),
  })
  .strict();
export const policySchema = z
  .object({
    version_id: label,
    version: label,
    status: z.enum(["TEST_ONLY", "ACTIVE"]),
    synthetic: z.boolean(),
    production_eligible: z.boolean(),
    allowed_prescription_engines: z.array(label).min(1),
    allowed_rule_engines: z.array(label).min(1),
    approved_nonblocking_codes: z.array(label),
  })
  .strict();
export const authoritySchema = z
  .object({
    template: z
      .object({ published: z.boolean(), production_eligible: z.boolean() })
      .strict(),
    content: z.record(
      z.string(),
      z
        .object({
          published: z.boolean(),
          production_eligible: z.boolean(),
          rights_eligible: z.boolean(),
          reviews_eligible: z.boolean(),
          current_for_new_use: z.boolean(),
        })
        .strict(),
    ),
  })
  .strict();
export const validationInputSchema = z
  .object({
    prescription: prescriptionSchema,
    request: requestSchema,
    candidates: z.array(poolCandidateSchema).max(200),
    template: templateSchema,
    rules: z.array(runtimeRuleSchema).max(100),
    rule_set_version: label,
    knowledge_version: label,
    policy: policySchema,
    authority: authoritySchema,
    stored_input_fingerprint: label,
    stored_artifact_fingerprint: label,
  })
  .strict();
export type ValidationInput = z.infer<typeof validationInputSchema>;
export type IndependentDose = z.infer<typeof independentDoseSchema>;
export type Finding = {
  code: string;
  version: 1;
  status: "ACTIVE";
  category: (typeof CATEGORIES)[number];
  severity: "WARNING" | "BLOCK";
  blocking: boolean;
  internal_explanation: string;
  public_explanation: string;
  references: string[];
};
