import { randomUUID } from "node:crypto";
import { z } from "zod";
import type pg from "pg";
import {
  prescribe,
  requestSchema,
  poolCandidateSchema,
  templateSchema,
  type Construction,
} from "@formation-zero/prescription-engine";
import {
  fixture,
  CATALOG_VERSION,
  catalog,
} from "@formation-zero/prescription-engine/fixtures";
import { fingerprint } from "@formation-zero/rule-engine";
import { transaction } from "../db.js";
import * as kb from "./store.js";
import { loadCandidate, loadRules } from "./rules.js";
import { keyedFingerprint } from "@formation-zero/validation-engine";
import { sealValidationInput } from "./validation-crypto.js";
const context = requestSchema.omit({ mode: true, individual_ref: true });
export const serviceRequest = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("TEST"),
      catalog_version: z.literal(CATALOG_VERSION),
      context,
    })
    .strict(),
  z
    .object({
      mode: z.literal("PRODUCTION"),
      template_version: z.uuid(),
      context,
    })
    .strict(),
]);
export async function fixtureCatalog(pool: pg.Pool, actor: kb.Actor) {
  return transaction(pool, async (c) => {
    await kb.access(c, actor);
    return {
      catalog_version: CATALOG_VERSION,
      rule_set_version: fixture().rule_set_version,
      candidates: catalog.map((x) => ({
        id: x.content.content_version,
        movement: x.content.movement,
        kind: x.kind,
      })),
      default_context: context.parse(
        Object.fromEntries(
          Object.entries(fixture().request).filter(
            ([k]) => !["mode", "individual_ref"].includes(k),
          ),
        ),
      ),
    };
  });
}
export async function constructStored(
  pool: pg.Pool,
  actor: kb.Actor,
  raw: unknown,
  secret: string,
  accessMode: "EDITORIAL" | "CONSUMER" = "EDITORIAL",
) {
  const body = serviceRequest.parse(raw);
  return transaction(pool, async (c) => {
    if (accessMode === "EDITORIAL") await kb.access(c, actor);
    else await kb.consumerAccess(c, actor);
    const request = {
      ...body.context,
      mode: body.mode,
      individual_ref: actor.userId,
    };
    let input: Construction = fixture(request.objective);
    let early: string | null = null;
    if (body.mode === "TEST") {
      if (
        request.candidate_scope.some(
          (id) => !catalog.some((x) => x.content.content_version === id),
        )
      )
        throw new kb.KnowledgeError(400, "UNKNOWN_SYNTHETIC_CANDIDATE");
      input.request = request;
    } else {
      const active = (
        await c.query(
          "SELECT rule_set_version FROM rule_activations ORDER BY sequence DESC LIMIT 1",
        )
      ).rows[0]?.rule_set_version;
      input = {
        ...input,
        request,
        // Failed production requests still retain the exact requested reference.
        // This placeholder is never eligible for construction.
        template: {
          ...input.template,
          version_id: body.template_version,
          synthetic: false,
          production_eligible: false,
        },
        candidates: [],
        rules: [],
        rule_set_version: active ?? "UNAVAILABLE",
        knowledge_version: "UNAVAILABLE",
      };
      if (!active) early = "RULE_SET_UNAVAILABLE";
      else {
        const set = await kb.get(c, active);
        if (
          set.kind !== "RULE_SET" ||
          set.payload.synthetic !== false ||
          !(await kb.publishedEligibility(c, set))
        )
          early = "RULE_SET_UNAVAILABLE";
        else input.rules = await loadRules(c, set, "PRODUCTION");
      }
      const version = await kb.get(c, body.template_version);
      if (
        version.kind !== "PRESCRIPTION_TEMPLATE" ||
        version.payload.synthetic !== false ||
        !(await kb.publishedEligibility(c, version))
      )
        early ??= "CONTENT_NOT_PRODUCTION_ELIGIBLE";
      else
        input.template = templateSchema.parse({
          ...(version.payload.definition as object),
          version_id: version.id,
          synthetic: false,
          production_eligible: true,
        });
      for (const id of [...new Set(request.candidate_scope)].sort()) {
        const v = await kb.get(c, z.uuid().parse(id));
        if (!["EXERCISE", "RECOVERY"].includes(v.kind))
          throw new kb.KnowledgeError(400, "INVALID_CANDIDATE_KIND");
        if (!(await kb.publishedEligibility(c, v))) {
          early ??= "CONTENT_NOT_PRODUCTION_ELIGIBLE";
          continue;
        }
        const relationships = (
          (v.payload.relationships ?? []) as { type?: string; target: string }[]
        )
          .filter((r) =>
            [
              "REGRESSION",
              "PROGRESSION",
              "SUBSTITUTION",
              "LOW_IMPACT",
              "NO_EQUIPMENT",
              "LIMITED_SPACE",
            ].includes(r.type ?? ""),
          )
          .map((r) => ({ type: r.type, target_version: r.target }));
        const parsed = poolCandidateSchema.safeParse({
          content: await loadCandidate(c, v),
          kind: v.kind,
          metadata: v.payload.prescription_metadata,
          relationships,
        });
        if (!parsed.success) {
          early ??= "REQUIRED_FACT_UNKNOWN";
          continue;
        }
        input.candidates.push(parsed.data);
      }
      input.knowledge_version = fingerprint(input.candidates);
    }
    const result = prescribe(input);
    if (early) {
      result.outcome = early as typeof result.outcome;
      result.session = null;
      result.public_rationale =
        "No candidate session could be constructed within the supplied constraints.";
    }
    // Keyed, domain-separated digests replace low-entropy material/fact hashes at the service boundary.
    const keyed = (v: unknown) => keyedFingerprint(secret, v);
    const material = structuredClone(result);
    if (material.provenance) {
      material.provenance.request_fingerprint = keyed(request);
      material.provenance.material_fingerprint = keyed(input);
      material.prescription_id =
        "FZ-RX-" + material.provenance.material_fingerprint;
    }
    if (material.internal.base) {
      material.internal.base.input_hash = keyed(
        material.internal.base.input_hash,
      );
      material.internal.base.evaluation_id =
        "FZ-EVAL-" + keyed(material.internal.base.evaluation_id);
    }
    const id = randomUUID();
    const artifactFingerprint = keyedFingerprint(
      secret,
      material,
      "formation-zero-prescription-artifact-v1",
    );
    const validationInput = sealValidationInput(secret, input);
    const row = (
      await c.query(
        "INSERT INTO prescriptions(id,actor_id,mode,input_fingerprint,material,validation_input,artifact_fingerprint) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING generated_at",
        [
          id,
          actor.userId,
          body.mode,
          keyed(input),
          JSON.stringify(material),
          validationInput,
          artifactFingerprint,
        ],
      )
    ).rows[0];
    // Normal prescription history is deliberately separate from editorial audit events.
    return { record_id: id, generated_at: row.generated_at, material };
  });
}
export async function readPrescription(
  pool: pg.Pool,
  actor: kb.Actor,
  id: string,
) {
  return transaction(pool, async (c) => {
    await kb.access(c, actor);
    const row = (
      await c.query(
        "SELECT id,generated_at,mode,material FROM prescriptions WHERE id=$1 AND actor_id=$2",
        [z.uuid().parse(id), actor.userId],
      )
    ).rows[0];
    if (!row) throw new kb.KnowledgeError(404, "NOT_FOUND");
    return row;
  });
}
