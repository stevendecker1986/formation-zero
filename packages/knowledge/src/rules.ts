import { templateDefinition } from "@formation-zero/prescription-engine/schemas";
import { z } from "zod";
import {
  ruleDefinitionSchema,
  reasonSchema,
} from "@formation-zero/rule-engine/schemas";
const authoring = {
  name: z.string().min(1).max(500),
  notes: z.string().max(2000).default(""),
  author: z.uuid(),
  rights: z.uuid(),
  provenance: z.enum([
    "OFFICIAL",
    "OFFICIAL_DERIVED",
    "FZ_ORIGINAL",
    "FZ_DERIVED",
    "SUPPORTING_EVIDENCE",
  ]),
  citations: z.array(z.uuid()).max(50),
  effective_date: z.iso.date().nullable().default(null),
  synthetic: z.boolean(),
};
export const ruleContentSchemas = {
  PRESCRIPTION_TEMPLATE: z
    .object({ ...authoring, definition: templateDefinition })
    .strict(),
  RULE: z
    .object({
      ...authoring,
      definition: ruleDefinitionSchema,
      reason_code: z.uuid(),
    })
    .strict(),
  REASON_CODE: z
    .object({ ...authoring, reason: reasonSchema.omit({ code: true }) })
    .strict(),
  RULE_SET: z
    .object({
      ...authoring,
      rules: z
        .array(z.uuid())
        .min(1)
        .max(100)
        .refine((v) => new Set(v).size === v.length),
    })
    .strict(),
};
