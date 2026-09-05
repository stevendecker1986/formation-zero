import type pg from "pg";
import { createHmac, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  evaluate,
  canonical,
  fingerprint,
  candidateSchema,
  factsSchema,
  runtimeRuleSchema,
  type Candidate,
} from "@formation-zero/rule-engine";
import { transaction } from "../db.js";
import * as kb from "./store.js";
const reference = z.uuid();
const testCandidate = candidateSchema.omit({
  synthetic: true,
  production_eligible: true,
  status: true,
  content_version: true,
});
export const evaluateRequest = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("TEST"),
      rule_set_version: reference,
      as_of: z.iso.date(),
      facts: factsSchema,
      candidates: z.array(testCandidate).max(1000),
    })
    .strict(),
  z
    .object({
      mode: z.literal("PRODUCTION"),
      as_of: z.iso.date(),
      facts: factsSchema,
      candidates: z.array(reference).max(1000),
    })
    .strict(),
]);
export async function activate(pool: pg.Pool, actor: kb.Actor, input: unknown) {
  const body = z
    .object({ rule_set_version: reference, reason: z.string().min(1).max(500) })
    .strict()
    .parse(input);
  return transaction(pool, async (c) => {
    await kb.access(c, actor, "PUBLISHER");
    const set = await kb.get(c, body.rule_set_version);
    if (
      set.kind !== "RULE_SET" ||
      set.payload.synthetic !== false ||
      !(await kb.publishedEligibility(c, set))
    )
      throw new kb.KnowledgeError(409, "RULE_SET_NOT_PRODUCTION_ELIGIBLE");
    // Exact rule references are never resolved to latest versions implicitly.
    const ids = new Set<string>();
    for (const id of set.payload.rules as string[]) {
      const rule = await kb.get(c, id);
      if (rule.payload.synthetic !== false || ids.has(rule.entity_id))
        throw new kb.KnowledgeError(409, "INVALID_RULE_SET");
      ids.add(rule.entity_id);
    }
    const result = await c.query(
      "INSERT INTO rule_activations(rule_set_version,activated_by,reason) VALUES($1,$2,$3) RETURNING sequence,rule_set_version,activated_at",
      [set.id, actor.userId, body.reason],
    );
    await kb.audit(c, actor, "rule_set.activated", set.id, {
      rule_count: ids.size,
    });
    return result.rows[0];
  });
}
export async function activationHistory(pool: pg.Pool, actor: kb.Actor) {
  return transaction(pool, async (c) => {
    await kb.access(c, actor);
    return (
      await c.query(
        "SELECT sequence,rule_set_version,activated_at FROM rule_activations ORDER BY sequence DESC LIMIT 100",
      )
    ).rows;
  });
}
export async function evaluateStored(
  pool: pg.Pool,
  actor: kb.Actor,
  raw: unknown,
  secret: string,
) {
  const body = evaluateRequest.parse(raw);
  return transaction(pool, async (c) => {
    await kb.access(c, actor);
    const active =
      body.mode === "PRODUCTION"
        ? (
            await c.query(
              "SELECT rule_set_version FROM rule_activations ORDER BY sequence DESC LIMIT 1",
            )
          ).rows[0]?.rule_set_version
        : body.rule_set_version;
    if (!active)
      throw new kb.KnowledgeError(409, "NO_ACTIVE_PRODUCTION_RULE_SET");
    const set = await kb.get(c, active);
    if (
      set.kind !== "RULE_SET" ||
      (body.mode === "TEST"
        ? set.payload.synthetic !== true
        : set.payload.synthetic !== false ||
          !(await kb.publishedEligibility(c, set)))
    )
      throw new kb.KnowledgeError(409, "RULE_SET_NOT_ELIGIBLE");
    const rules = [];
    for (const id of set.payload.rules as string[]) {
      const v = await kb.get(c, id),
        reason = await kb.get(c, String(v.payload.reason_code));
      if (
        v.kind !== "RULE" ||
        reason.kind !== "REASON_CODE" ||
        v.payload.synthetic !== set.payload.synthetic ||
        reason.payload.synthetic !== set.payload.synthetic
      )
        throw new kb.KnowledgeError(409, "INVALID_RULE_SET");
      rules.push(
        runtimeRuleSchema.parse({
          ...(v.payload.definition as object),
          rule_id: v.code,
          version: v.version,
          version_id: v.id,
          status: v.status,
          synthetic: v.payload.synthetic,
          production_eligible:
            body.mode === "PRODUCTION" && (await kb.publishedEligibility(c, v)),
          provenance: v.payload.provenance,
          citations: v.payload.citations,
          reason_version_id: reason.id,
          reason: { ...(reason.payload.reason as object), code: reason.code },
        }),
      );
    }
    const candidates: Candidate[] = [];
    if (body.mode === "TEST")
      for (const v of body.candidates)
        candidates.push({
          ...v,
          content_version: "SYNTHETIC:" + v.id,
          synthetic: true,
          production_eligible: false,
          status: "TEST_ONLY",
        });
    else
      for (const id of body.candidates) {
        const v = await kb.get(c, id),
          p = v.payload;
        if (!["EXERCISE", "RECOVERY"].includes(v.kind))
          throw new kb.KnowledgeError(400, "INVALID_CANDIDATE_KIND");
        const metadata = (p.rule_metadata ?? {}) as Record<string, unknown>;
        candidates.push(
          candidateSchema.parse({
            id: v.code,
            content_version: v.id,
            status: v.status,
            synthetic: false,
            production_eligible: await kb.publishedEligibility(c, v),
            tags: metadata.tags ?? null,
            movement: p.primary_movement ?? null,
            capability: p.primary_capability ?? null,
            complexity: p.technical_complexity ?? null,
            intensity: metadata.intensity ?? null,
            equipment: p.equipment ?? null,
            restrictions: p.restrictions ?? null,
            environment: metadata.environment ?? null,
            supervision_required: metadata.supervision_required ?? null,
            demand: p.demand_profile ?? {},
          }),
        );
      }
    const knowledge_version = fingerprint(candidates);
    const evaluationInput = {
      mode: body.mode,
      as_of: body.as_of,
      rule_set_version: set.id,
      knowledge_version,
      facts: body.facts,
      candidates,
      rules,
    };
    const result = evaluate(evaluationInput);
    const id = randomUUID(),
      inputFingerprint = createHmac("sha256", secret)
        .update(
          "formation-zero-rule-evaluation-v1:" + canonical(evaluationInput),
        )
        .digest("hex");
    const provenance = {
      engine_version: result.engine_version,
      rule_set_version: set.id,
      knowledge_version,
      rule_versions: result.rule_versions,
      as_of: body.as_of,
      outcome: result.outcome,
      results: result.results.map((r) => ({
        content_version: r.content_version,
        eligible: r.eligible,
        reason_codes: r.reasons.map((x) => x.code),
        constraints: r.constraints,
      })),
    };
    const saved = await c.query(
      "INSERT INTO rule_evaluations(id,actor_id,mode,rule_set_version,engine_version,input_fingerprint,provenance) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING evaluated_at",
      [
        id,
        actor.userId,
        body.mode,
        set.id,
        result.engine_version,
        inputFingerprint,
        JSON.stringify(provenance),
      ],
    );
    // Do not place facts, hashes, output, reasons or candidate identifiers in generic audit/logs.
    await kb.audit(c, actor, "rule_evaluation.created", id, {
      mode: body.mode,
      candidate_count: candidates.length,
    });
    return {
      record_id: id,
      evaluated_at: saved.rows[0].evaluated_at,
      material: result,
    };
  });
}
export async function readEvaluation(
  pool: pg.Pool,
  actor: kb.Actor,
  id: string,
) {
  return transaction(pool, async (c) => {
    await kb.access(c, actor);
    const result = (
      await c.query(
        "SELECT id,evaluated_at,mode,rule_set_version,engine_version,provenance FROM rule_evaluations WHERE id=$1 AND actor_id=$2",
        [reference.parse(id), actor.userId],
      )
    ).rows[0];
    if (!result) throw new kb.KnowledgeError(404, "NOT_FOUND");
    return result;
  });
}
