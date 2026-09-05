import { randomUUID } from "node:crypto";
import type pg from "pg";
import { z } from "zod";
import {
  ENGINE_VERSION,
  keyedFingerprint,
  policySchema,
  validate,
  type ValidationInput,
} from "@formation-zero/validation-engine";
import { transaction } from "../db.js";
import * as kb from "./store.js";
import { openValidationInput } from "./validation-crypto.js";

const reference = z.uuid();
const validateRequest = z
  .object({ prescription_record_id: reference })
  .strict();
const activationRequest = z
  .object({ policy_id: reference, reason: z.string().min(3).max(500) })
  .strict();
const createPolicyRequest = policySchema
  .omit({ version_id: true })
  .refine(
    (value) =>
      value.status === "ACTIVE" &&
      !value.synthetic &&
      value.production_eligible,
    "Only production-eligible policies may be registered",
  );

export const TEST_POLICY = policySchema.parse({
  version_id: "SYNTHETIC-E-POLICY:1",
  version: "SYNTHETIC-E-POLICY-V1",
  status: "TEST_ONLY",
  synthetic: true,
  production_eligible: false,
  allowed_prescription_engines: ["1.0.0"],
  allowed_rule_engines: ["1.0.0"],
  approved_nonblocking_codes: ["FZ-VAL-STRUCTURE-090"],
});
export const ADVERSARIAL_FIXTURES = [
  "phase-c-blocked",
  "unpublished-b2",
  "content-version-tamper",
  "rule-set-tamper",
  "request-fingerprint-tamper",
  "time-budget",
  "required-rest",
  "negative-rest",
  "intensity-cap",
  "volume-cap",
  "unavailable-equipment",
  "overhead-restriction",
  "high-impact-restriction",
  "red-strenuous",
  "orange-cap",
  "relationship-direction",
  "substitution-equipment",
  "duplicate-item",
  "required-primary",
  "objective-template",
  "public-rationale",
  "missing-provenance",
  "post-validation-tamper",
  "client-pass-forgery",
  "client-policy-forgery",
  "retired-content",
  "required-recovery",
  "interval-math",
  "stated-total",
  "supervision",
] as const;

export async function fixtureCatalog(pool: pg.Pool, actor: kb.Actor) {
  return transaction(pool, async (c) => {
    await kb.access(c, actor);
    return {
      policy: TEST_POLICY.version,
      scenarios: ADVERSARIAL_FIXTURES,
      execution: "Automated isolated mutation suite",
    };
  });
}

async function policyFor(c: pg.PoolClient, mode: "TEST" | "PRODUCTION") {
  if (mode === "TEST")
    return { id: null as string | null, policy: TEST_POLICY };
  const row = (
    await c.query<{ id: string; definition: unknown }>(
      "SELECT p.id,p.definition FROM validation_policy_activations a JOIN validation_policies p ON p.id=a.policy_id ORDER BY a.sequence DESC LIMIT 1",
    )
  ).rows[0];
  if (!row) throw new kb.KnowledgeError(409, "NO_ACTIVE_VALIDATION_POLICY");
  return { id: row.id, policy: policySchema.parse(row.definition) };
}

async function versionAuthority(c: pg.PoolClient, id: string) {
  const version = await kb.get(c, id);
  const current = (
    await c.query<{ id: string }>(
      "SELECT id FROM kb_versions WHERE entity_id=$1 ORDER BY version DESC LIMIT 1",
      [version.entity_id],
    )
  ).rows[0]?.id;
  const eligible = await kb.publishedEligibility(c, version);
  let rightsEligible = eligible;
  if (version.payload.rights) {
    const rights = await kb.get(c, String(version.payload.rights));
    const currentRights = (
      await c.query<{ id: string }>(
        "SELECT id FROM kb_versions WHERE entity_id=$1 ORDER BY version DESC LIMIT 1",
        [rights.entity_id],
      )
    ).rows[0]?.id;
    rightsEligible =
      eligible &&
      !["UNKNOWN", "THIRD_PARTY_COPYRIGHT"].includes(
        String(rights.payload.classification),
      ) &&
      rights.payload.commercial_use_allowed === true &&
      currentRights === rights.id &&
      !["RETIRED", "SUPERSEDED"].includes(rights.status);
  }
  return {
    published: version.status === "PUBLISHED",
    production_eligible: eligible,
    rights_eligible: rightsEligible,
    reviews_eligible: eligible,
    current_for_new_use: current === version.id,
  };
}

async function inputFor(
  c: pg.PoolClient,
  actor: kb.Actor,
  recordId: string,
  secret: string,
) {
  const row = (
    await c.query<{
      id: string;
      mode: "TEST" | "PRODUCTION";
      material: unknown;
      validation_input: Buffer | null;
      input_fingerprint: string;
      artifact_fingerprint: string | null;
    }>(
      "SELECT id,mode,material,validation_input,input_fingerprint,artifact_fingerprint FROM prescriptions WHERE id=$1 AND actor_id=$2",
      [reference.parse(recordId), actor.userId],
    )
  ).rows[0];
  if (!row) throw new kb.KnowledgeError(404, "NOT_FOUND");
  if (!row.validation_input || !row.artifact_fingerprint)
    throw new kb.KnowledgeError(409, "VALIDATION_INPUT_UNAVAILABLE");
  let construction: Omit<
    ValidationInput,
    | "prescription"
    | "policy"
    | "authority"
    | "stored_input_fingerprint"
    | "stored_artifact_fingerprint"
  >;
  try {
    construction = openValidationInput(
      secret,
      row.validation_input,
    ) as typeof construction;
  } catch {
    throw new kb.KnowledgeError(409, "VALIDATION_INPUT_INVALID");
  }
  const selected = new Set(
    (
      row.material as { session?: { lines?: { content_version: string }[] } }
    )?.session?.lines?.map((line) => line.content_version) ?? [],
  );
  const content: ValidationInput["authority"]["content"] = {};
  for (const candidate of construction.candidates)
    if (row.mode === "TEST")
      content[candidate.content.content_version] = {
        published: false,
        production_eligible: false,
        rights_eligible: false,
        reviews_eligible: false,
        current_for_new_use: true,
      };
    else if (selected.has(candidate.content.content_version))
      content[candidate.content.content_version] = await versionAuthority(
        c,
        candidate.content.content_version,
      );
  const activePolicy = await policyFor(c, row.mode);
  const templateAuthority =
    row.mode === "TEST"
      ? { published: false, production_eligible: false }
      : await versionAuthority(c, construction.template.version_id);
  return {
    row,
    policyId: activePolicy.id,
    input: {
      ...construction,
      prescription: row.material,
      policy: activePolicy.policy,
      authority: {
        template: {
          published: templateAuthority.published,
          production_eligible: templateAuthority.production_eligible,
        },
        content,
      },
      stored_input_fingerprint: row.input_fingerprint,
      stored_artifact_fingerprint: row.artifact_fingerprint,
    },
  };
}

export async function validateStored(
  pool: pg.Pool,
  actor: kb.Actor,
  raw: unknown,
  secret: string,
) {
  const body = validateRequest.parse(raw);
  return transaction(pool, async (c) => {
    await kb.access(c, actor);
    const prepared = await inputFor(
      c,
      actor,
      body.prescription_record_id,
      secret,
    );
    const material = validate(prepared.input, secret);
    const id = randomUUID();
    const validatedAt = new Date().toISOString();
    const stored = { ...material, validated_at: validatedAt };
    await c.query(
      "INSERT INTO prescription_validations(id,prescription_record_id,actor_id,policy_id,policy_version,engine_version,status,codes,input_fingerprint,result,validated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [
        id,
        prepared.row.id,
        actor.userId,
        prepared.policyId,
        material.policy_version,
        ENGINE_VERSION,
        material.status,
        material.codes,
        keyedFingerprint(
          secret,
          prepared.input,
          "formation-zero-validation-history-v1",
        ),
        JSON.stringify(stored),
        validatedAt,
      ],
    );
    return { record_id: id, validated_at: validatedAt, material: stored };
  });
}

export async function readValidation(
  pool: pg.Pool,
  actor: kb.Actor,
  id: string,
) {
  return transaction(pool, async (c) => {
    await kb.access(c, actor);
    const row = (
      await c.query(
        "SELECT id,prescription_record_id,policy_version,engine_version,status,codes,result,validated_at FROM prescription_validations WHERE id=$1 AND actor_id=$2",
        [reference.parse(id), actor.userId],
      )
    ).rows[0];
    if (!row) throw new kb.KnowledgeError(404, "NOT_FOUND");
    return row;
  });
}

export async function deliver(
  pool: pg.Pool,
  actor: kb.Actor,
  prescriptionId: string,
  secret: string,
) {
  return transaction(pool, async (c) => {
    await kb.access(c, actor);
    const prepared = await inputFor(c, actor, prescriptionId, secret);
    if (prepared.row.mode !== "PRODUCTION")
      throw new kb.KnowledgeError(409, "TEST_PRESCRIPTION_NOT_DELIVERABLE");
    const latest = (
      await c.query<{ status: string; policy_version: string }>(
        "SELECT status,policy_version FROM prescription_validations WHERE prescription_record_id=$1 AND actor_id=$2 ORDER BY validated_at DESC,id DESC LIMIT 1",
        [prescriptionId, actor.userId],
      )
    ).rows[0];
    const current = validate(prepared.input, secret);
    if (
      !latest ||
      !["PASS", "WARN"].includes(latest.status) ||
      latest.policy_version !== current.policy_version ||
      !["PASS", "WARN"].includes(current.status)
    )
      throw new kb.KnowledgeError(409, "PRESCRIPTION_NOT_DELIVERABLE");
    return {
      prescription_record_id: prepared.row.id,
      validation_status: current.status,
      material: prepared.row.material,
    };
  });
}

export async function createPolicy(
  pool: pg.Pool,
  actor: kb.Actor,
  raw: unknown,
) {
  const body = createPolicyRequest.parse(raw);
  return transaction(pool, async (c) => {
    await kb.access(c, actor, "PUBLISHER");
    const id = randomUUID();
    const definition = { ...body, version_id: id };
    const row = (
      await c.query(
        "INSERT INTO validation_policies(id,version,status,synthetic,production_eligible,definition,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,version,status,synthetic,production_eligible,created_at",
        [
          id,
          body.version,
          body.status,
          body.synthetic,
          body.production_eligible,
          JSON.stringify(definition),
          actor.userId,
        ],
      )
    ).rows[0];
    await kb.audit(c, actor, "validation_policy.created", id, {
      version: body.version,
    });
    return row;
  });
}

export async function activatePolicy(
  pool: pg.Pool,
  actor: kb.Actor,
  raw: unknown,
) {
  const body = activationRequest.parse(raw);
  return transaction(pool, async (c) => {
    await kb.access(c, actor, "PUBLISHER");
    const policy = (
      await c.query<{ definition: unknown }>(
        "SELECT definition FROM validation_policies WHERE id=$1",
        [body.policy_id],
      )
    ).rows[0];
    if (!policy) throw new kb.KnowledgeError(404, "NOT_FOUND");
    const parsed = policySchema.parse(policy.definition);
    if (
      parsed.status !== "ACTIVE" ||
      parsed.synthetic ||
      !parsed.production_eligible
    )
      throw new kb.KnowledgeError(
        409,
        "VALIDATION_POLICY_NOT_PRODUCTION_ELIGIBLE",
      );
    const row = (
      await c.query(
        "INSERT INTO validation_policy_activations(policy_id,activated_by,reason) VALUES($1,$2,$3) RETURNING sequence,policy_id,activated_at",
        [body.policy_id, actor.userId, body.reason],
      )
    ).rows[0];
    await kb.audit(c, actor, "validation_policy.activated", body.policy_id, {
      version: parsed.version,
    });
    return row;
  });
}

export async function policies(pool: pg.Pool, actor: kb.Actor) {
  return transaction(pool, async (c) => {
    await kb.access(c, actor);
    return (
      await c.query(
        "SELECT id,version,status,synthetic,production_eligible,created_at FROM validation_policies ORDER BY created_at DESC,id DESC LIMIT 100",
      )
    ).rows;
  });
}

export async function activationHistory(pool: pg.Pool, actor: kb.Actor) {
  return transaction(pool, async (c) => {
    await kb.access(c, actor);
    return (
      await c.query(
        "SELECT a.sequence,a.policy_id,p.version,a.activated_at FROM validation_policy_activations a JOIN validation_policies p ON p.id=a.policy_id ORDER BY a.sequence DESC LIMIT 100",
      )
    ).rows;
  });
}
