import { ruleContentSchemas } from "./rules";
import { z } from "zod";
import { PROVENANCE, RIGHTS, CONTENT_STATUSES } from "@formation-zero/domain";
export const KINDS = [
  "RULE",
  "REASON_CODE",
  "RULE_SET",
  "SOURCE",
  "SOURCE_VERSION",
  "SOURCE_SECTION",
  "CITATION",
  "AUTHOR",
  "QUALIFICATION",
  "REVIEWER",
  "EXERCISE",
  "EQUIPMENT",
  "RECOVERY",
  "RESTRICTION",
  "MEDIA_REQUIREMENT",
  "MEDIA_ASSET",
  "RIGHTS",
] as const;
export type Kind = (typeof KINDS)[number];
export const REVIEWS = [
  "TECHNICAL",
  "SAFETY",
  "EDITORIAL",
  "RIGHTS",
  "POLICY",
  "SPECIALTY",
] as const;
export type ReviewType = (typeof REVIEWS)[number];
export const PERMISSIONS = [
  "CONTENT_EDITOR",
  "TECHNICAL_REVIEWER",
  "SAFETY_REVIEWER",
  "EDITORIAL_REVIEWER",
  "RIGHTS_REVIEWER",
  "POLICY_REVIEWER",
  "SPECIALTY_REVIEWER",
  "PUBLISHER",
] as const;
export type Permission = (typeof PERMISSIONS)[number];
export const SPECIALTIES = [
  "NUTRITION",
  "SPORTS_MEDICINE",
  "ENDURANCE",
  "STRENGTH_CONDITIONING",
  "FORCE_FITNESS",
  "MCMAP",
  "OTHER",
] as const;
export const MOVEMENTS = [
  "Push",
  "Pull",
  "Squat",
  "Hinge",
  "Lunge",
  "Rotation",
  "Anti-Rotation",
  "Brace",
  "Carry",
  "Locomotion",
  "Crawl",
  "Ground-to-Standing",
  "Jump",
  "Land",
  "Throw",
  "Sprint",
  "Change of Direction",
  "Climb",
  "Drag",
  "Lift",
  "Aquatic",
] as const;
export const CAPABILITIES = [
  "Maximal Strength",
  "Relative Strength",
  "Strength Endurance",
  "Power",
  "Speed",
  "Acceleration",
  "Agility",
  "Aerobic Endurance",
  "Anaerobic Capacity",
  "Muscular Endurance",
  "Work Capacity",
  "Mobility",
  "Stability",
  "Coordination",
  "Balance",
  "Grip",
  "Running",
  "Rucking",
  "Load Carriage",
  "Aquatic Conditioning",
  "Tactical Conditioning",
  "Recovery",
  "Durability",
] as const;
export const DEMANDS = [
  "muscular_demand",
  "cardiovascular_demand",
  "neurological_demand",
  "impact_demand",
  "upper_body_demand",
  "lower_body_demand",
  "trunk_demand",
  "grip_demand",
  "axial_loading",
  "eccentric_loading",
  "technical_demand",
  "running_interference",
  "rucking_interference",
  "recovery_cost",
] as const;
export const FORMATIONS = [
  "Individual",
  "Partner",
  "Fire Team",
  "Squad",
  "Platoon",
  "Company+",
] as const;
export const VIEWS = [
  "START",
  "KEY_POSITION",
  "FINISH",
  "ALTERNATE",
  "COMMON_FAULT",
  "REGRESSION",
  "PROGRESSION",
] as const;
export const RELATIONS = [
  "REGRESSION",
  "PROGRESSION",
  "SUBSTITUTION",
  "LOW_IMPACT",
  "NO_EQUIPMENT",
  "LIMITED_SPACE",
  "UNIT_PT",
  "FUNCTIONAL_RESTRICTION",
  "RECOVERY",
] as const;
const text = z.string().trim().min(1).max(500);
const note = z.string().max(2000).default("");
const id = z.uuid();
const date = z.iso.date().nullable().default(null);
const score = z.number().int().min(0).max(5);
const ids = z
  .array(id)
  .max(50)
  .default([])
  .refine((values) => new Set(values).size === values.length, {
    message: "Duplicate version references are not allowed",
  });
const names = z.array(text).max(20).default([]);
const common = { name: text, notes: note };
const authored = {
  author: id,
  rights: id,
  provenance: z.enum(PROVENANCE),
  citations: ids,
  effective_date: date,
};
const demand = z.record(z.enum(DEMANDS), score);
const suitability = z.record(z.enum(FORMATIONS), score);
const relation = z
  .object({ type: z.enum(RELATIONS), target: id, notes: note })
  .strict();
const content = {
  ...common,
  ...authored,
  aliases: names,
  equipment: ids,
  rule_metadata: z
    .object({
      tags: names,
      environment: names,
      intensity: score.nullable(),
      supervision_required: z.boolean().nullable(),
    })
    .strict()
    .optional(),
};
export const schemas = {
  ...ruleContentSchemas,
  SOURCE: z
    .object({
      ...common,
      issuing_authority: text,
      source_type: z.enum([
        "ORDER",
        "DIRECTIVE",
        "MARADMIN",
        "GUIDE",
        "MANUAL",
        "ARTICLE",
        "RESEARCH",
        "COURSE_MATERIAL",
        "WEBSITE",
        "POLICY",
        "BOOK",
        "OTHER",
      ]),
      source_url: z.string().max(1000).default(""),
      rights: id.optional(),
      publication_number: z.string().max(200).default(""),
      publication_date: date,
      provenance: z.enum(PROVENANCE),
    })
    .strict(),
  SOURCE_VERSION: z
    .object({
      ...common,
      source: id,
      version_identifier: text,
      effective_date: date,
      superseded_date: date,
      change_identifier: z.string().max(200).default(""),
      checksum: z.string().max(128).default(""),
      locator: text,
      currency_observation: z
        .object({
          status: z.enum([
            "CURRENT",
            "AMENDED",
            "SUPERSEDED",
            "PARTIALLY_SUPERSEDED",
            "FUTURE_EFFECTIVE",
            "HISTORICAL_ONLY",
          ]),
          checked_on: z.iso.date(),
          evidence_url: z.url().max(1000),
          scope: text,
          notes: note,
        })
        .strict()
        .optional(),
    })
    .strict(),
  SOURCE_SECTION: z
    .object({
      ...common,
      source_version: id,
      section_code: text,
      page_start: z.number().int().positive().nullable().default(null),
      page_end: z.number().int().positive().nullable().default(null),
      paragraph_locator: z.string().max(500).default(""),
      excerpt_note: note,
      normalized_locator: text,
    })
    .strict()
    .refine(
      (v) =>
        v.page_start === null ||
        v.page_end === null ||
        v.page_end >= v.page_start,
      { message: "Invalid page range" },
    ),
  CITATION: z
    .object({ ...common, section: id, purpose: text, support_type: text })
    .strict(),
  AUTHOR: z
    .object({
      ...common,
      author_role: text,
      public_affiliation: z.string().max(200).default(""),
      platform_user_id: z.string().max(100).nullable().default(null),
      active: z.boolean().default(true),
    })
    .strict(),
  QUALIFICATION: z
    .object({
      ...common,
      person: id,
      credential_name: text,
      issuing_organization: text,
      credential_identifier: z.string().max(200).default(""),
      issued_date: date,
      expiration_date: date,
      status: z.enum(["ACTIVE", "EXPIRED", "INACTIVE"]),
    })
    .strict(),
  REVIEWER: z
    .object({
      ...common,
      person: id,
      user_id: z.string().min(1).max(100),
      review_types: z.array(z.enum(REVIEWS)).min(1).max(6),
      specialties: z.array(z.enum(SPECIALTIES)).max(7).default([]),
      active: z.boolean().default(true),
    })
    .strict(),
  EQUIPMENT: z
    .object({
      ...common,
      aliases: names,
      category: text,
      mobility: z.enum(["PORTABLE", "FIXED", "NONE"]),
      quantity_semantics: z.enum(["PER_PERSON", "SHARED", "PAIR", "NONE"]),
      provenance: z.enum(PROVENANCE),
    })
    .strict(),
  RESTRICTION: z
    .object({
      ...common,
      category: text,
      body_region: text,
      severity: text,
      eligibility_behavior: text,
      source: id,
      reviewer: id,
    })
    .strict(),
  EXERCISE: z
    .object({
      ...content,
      summary: text,
      instructions: z.string().min(1).max(5000),
      coaching_cues: names.optional(),
      common_faults: names.optional(),
      cautions: names.optional(),
      classification_rationale: note.optional(),
      primary_movement: z.enum(MOVEMENTS),
      secondary_movements: z.array(z.enum(MOVEMENTS)).max(20).default([]),
      primary_capability: z.enum(CAPABILITIES),
      secondary_capabilities: z.array(z.enum(CAPABILITIES)).max(22).default([]),
      technical_complexity: z.number().int().min(1).max(5),
      demand_profile: demand,
      formation_suitability: suitability,
      individual_suitability: score,
      scaling_available: z.boolean(),
      restrictions: ids,
      media_requirement: id,
      media_assets: ids,
      parent_exercise: id.nullable().default(null),
      variant: z
        .enum([
          "FOUNDATION",
          "READY",
          "PERFORM",
          "ALTERNATE_EQUIPMENT",
          "LOW_IMPACT",
          "LIMITED_SPACE",
          "NO_EQUIPMENT",
          "OTHER",
        ])
        .nullable()
        .default(null),
      relationships: z.array(relation).max(50).default([]),
    })
    .strict()
    .refine(
      (v) =>
        !v.secondary_movements.includes(v.primary_movement) &&
        !v.secondary_capabilities.includes(v.primary_capability),
      { message: "Primary taxonomy cannot be secondary" },
    ),
  RECOVERY: z
    .object({
      ...content,
      category: text,
      purpose: text,
      typical_use: note,
      demand: score,
      intensity: text,
      duration_guidance: note,
      body_area: text,
      relationships: z
        .array(
          z
            .object({
              target_type: z.enum([
                "EXERCISE",
                "MOVEMENT",
                "CAPABILITY",
                "TRAINING_TYPE",
                "BODY_AREA",
                "STRESS_CATEGORY",
              ]),
              target: text,
              notes: note,
            })
            .strict()
            .refine(
              (v) =>
                v.target_type === "EXERCISE"
                  ? id.safeParse(v.target).success
                  : v.target_type === "MOVEMENT"
                    ? (MOVEMENTS as readonly string[]).includes(v.target)
                    : v.target_type === "CAPABILITY"
                      ? (CAPABILITIES as readonly string[]).includes(v.target)
                      : true,
              { message: "Invalid recovery relationship target" },
            ),
        )
        .max(50)
        .default([]),
    })
    .strict(),
  MEDIA_REQUIREMENT: z
    .object({
      ...common,
      media_requirement_type: z
        .enum([
          "NONE",
          "SINGLE_STILL",
          "STILL_SEQUENCE",
          "OPTIONAL_VIDEO",
          "VIDEO_RECOMMENDED",
        ])
        .default("STILL_SEQUENCE"),
      minimum_images: z.number().int().min(0).max(4).default(1),
      recommended_images: z.number().int().min(0).max(4).default(3),
      maximum_images: z.number().int().min(0).max(4).default(4),
      required_views: z
        .array(z.enum(VIEWS))
        .max(4)
        .default(["START", "KEY_POSITION", "FINISH"]),
      motion_complexity: z.enum(["LOW", "MODERATE", "HIGH"]).default("LOW"),
      video_recommended: z.boolean().default(false),
      video_required: z.literal(false).default(false),
      technical_media_review_required: z.boolean().default(true),
      rights_review_required: z.literal(true).default(true),
    })
    .strict()
    .refine(
      (v) =>
        v.minimum_images <= v.recommended_images &&
        v.recommended_images <= v.maximum_images &&
        new Set(v.required_views).size === v.required_views.length &&
        v.required_views.length <= v.maximum_images &&
        (v.media_requirement_type !== "STILL_SEQUENCE" ||
          v.minimum_images >= 1) &&
        (v.media_requirement_type !== "SINGLE_STILL" ||
          v.maximum_images === 1) &&
        (v.media_requirement_type !== "NONE" ||
          (v.maximum_images === 0 && v.required_views.length === 0)),
      { message: "Inconsistent image requirements" },
    ),
  MEDIA_ASSET: z
    .object({
      ...common,
      ...authored,
      asset_type: z.enum([
        "IMAGE",
        "VIDEO",
        "ILLUSTRATION",
        "DIAGRAM",
        "AUDIO",
      ]),
      view: z.enum(VIEWS).nullable().default(null),
      storage_locator: text,
      checksum: text,
      width: z.number().int().positive().nullable().default(null),
      height: z.number().int().positive().nullable().default(null),
      duration_seconds: z.number().nonnegative().nullable().default(null),
      creator: text,
    })
    .strict(),
  RIGHTS: z
    .object({
      ...common,
      classification: z.enum(RIGHTS),
      rights_holder: text,
      creator: text,
      source: z.string().max(1000).default(""),
      license: note,
      commercial_use_allowed: z.boolean(),
      modification_allowed: z.boolean(),
      attribution_required: z.boolean(),
      permission_reference: note,
    })
    .strict(),
};
export const createSchema = z
  .object({ kind: z.enum(KINDS), data: z.unknown() })
  .strict();
export const versionSchema = z
  .object({ expected_version: z.number().int().positive(), data: z.unknown() })
  .strict();
export const reviewSchema = z
  .object({
    reviewer: id,
    type: z.enum(REVIEWS),
    decision: z.enum(["APPROVE", "REJECT", "CHANGES_REQUIRED"]),
    comments: z.string().min(1).max(2000),
    re_review_date: date,
    specialty: z.enum(SPECIALTIES).nullable().default(null),
  })
  .strict();
export const transitionSchema = z
  .object({
    action: z.enum(["SUBMIT", "APPROVE", "PUBLISH", "SUPERSEDE", "RETIRE"]),
    expected_revision: z.number().int().nonnegative(),
    target: id.nullable().default(null),
    reason: text,
  })
  .strict();
export const filterSchema = z
  .object({
    kind: z.enum(KINDS).optional(),
    corpus: z.literal("PHASE_B2_INITIAL").optional(),
    q: z.string().max(100).optional(),
    status: z.enum(CONTENT_STATUSES).optional(),
    provenance: z.enum(PROVENANCE).optional(),
    rights: z.enum(RIGHTS).optional(),
    review: z
      .enum(["PENDING", "APPROVE", "REJECT", "CHANGES_REQUIRED"])
      .optional(),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .strict();
export type Payload = Record<string, unknown>;
export function parsePayload(kind: Kind, data: unknown): Payload {
  return schemas[kind].parse(data);
}
export function requiredReviews(kind: Kind, provenance: unknown): ReviewType[] {
  const result: ReviewType[] = [
    "EXERCISE",
    "RECOVERY",
    "RULE",
    "REASON_CODE",
    "RULE_SET",
  ].includes(kind)
    ? ["TECHNICAL", "SAFETY", "EDITORIAL", "RIGHTS"]
    : kind === "MEDIA_ASSET"
      ? ["TECHNICAL", "RIGHTS"]
      : kind === "RIGHTS"
        ? ["RIGHTS"]
        : kind === "QUALIFICATION"
          ? ["TECHNICAL"]
          : ["EDITORIAL"];
  if (provenance === "OFFICIAL" || provenance === "OFFICIAL_DERIVED")
    result.push("TECHNICAL", "POLICY", "EDITORIAL", "RIGHTS");
  return [...new Set(result)];
}
