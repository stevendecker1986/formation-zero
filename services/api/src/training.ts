import { randomUUID } from "node:crypto";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type pg from "pg";
import { z } from "zod";
import type { ServerConfig } from "@formation-zero/config";
import type { AuthorizationContext } from "@formation-zero/domain";
import {
  actualWriteSchema,
  historyFilterSchema,
  safetyChangeSchema,
  substitutionRequestSchema,
  syntheticDemoAllowed,
  transition,
  transitionRequestSchema,
  type ExecutionState,
} from "@formation-zero/execution-engine";
import {
  fixture,
  catalog,
  CATALOG_VERSION,
} from "@formation-zero/prescription-engine/fixtures";
import { OBJECTIVES } from "@formation-zero/prescription-engine/schemas";
import { keyedFingerprint } from "@formation-zero/validation-engine";
import { transaction } from "./db.js";
import * as prescriptions from "./knowledge/prescriptions.js";
import * as validations from "./knowledge/validations.js";
import { openValidationInput } from "./knowledge/validation-crypto.js";

type Actor = { userId: string; requestId: string };
type StoredMaterial = {
  outcome: string;
  prescription_id: string | null;
  public_rationale: string;
  session: null | {
    objective: string;
    total_seconds: number;
    sections: { section: string; total_seconds: number }[];
    lines: {
      slot_id: string;
      section: string;
      content_version: string;
      candidate_id: string;
      dose: unknown;
      total_seconds: number;
    }[];
  };
  provenance?: Record<string, unknown> | null;
};

export class TrainingError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

const requestSchema = z
  .object({
    idempotency_key: z
      .string()
      .min(8)
      .max(100)
      .regex(/^[A-Za-z0-9._:-]+$/),
    demo: z.boolean().default(false),
    training_date: z.iso.date(),
    objective: z.enum(OBJECTIVES),
    duration_seconds: z.number().int().min(300).max(14400),
    equipment: z
      .object({
        available: z.array(z.string().min(1).max(100)).max(100),
        unsafe: z.array(z.string().min(1).max(100)).max(100),
      })
      .strict(),
    space: z.enum(["STANDARD", "LIMITED", "UNKNOWN"]),
    restrictions: z
      .object({
        pain: z.boolean().default(false),
        running_allowed: z.boolean().default(true),
        jumping_allowed: z.boolean().default(true),
        overhead_allowed: z.boolean().default(true),
        loaded_carry_allowed: z.boolean().default(true),
        high_impact_allowed: z.boolean().default(true),
        deep_knee_flexion_allowed: z.boolean().default(true),
        excluded_movements: z
          .array(z.string().min(1).max(100))
          .max(30)
          .default([]),
      })
      .strict()
      .default({
        pain: false,
        running_allowed: true,
        jumping_allowed: true,
        overhead_allowed: true,
        loaded_carry_allowed: true,
        high_impact_allowed: true,
        deep_knee_flexion_allowed: true,
        excluded_movements: [],
      }),
    environment_surface_safe: z.boolean().default(true),
    preferences: z.array(z.string().min(1).max(100)).max(20).default([]),
    candidate_scope: z.array(z.string().min(1).max(100)).max(200).default([]),
    template_version: z.uuid().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.demo && !value.template_version)
      ctx.addIssue({
        code: "custom",
        path: ["template_version"],
        message: "Required",
      });
  });

const positionSchema = z
  .object({
    expected_version: z.number().int().nonnegative(),
    idempotency_key: z
      .string()
      .min(8)
      .max(100)
      .regex(/^[A-Za-z0-9._:-]+$/),
    line_index: z.number().int().nonnegative().max(99),
  })
  .strict();

const safeCodes = new Set([
  "NO_SAFE_PRESCRIPTION",
  "REQUIRED_FACT_UNKNOWN",
  "INSUFFICIENT_ELIGIBLE_CONTENT",
  "INSUFFICIENT_TIME",
  "REQUIRED_EQUIPMENT_UNAVAILABLE",
  "CONTENT_NOT_PRODUCTION_ELIGIBLE",
  "RULE_SET_UNAVAILABLE",
]);

function actor(res: Response): Actor {
  return {
    userId: String(res.locals.userId),
    requestId: String(res.locals.requestId),
  };
}
function context(res: Response): AuthorizationContext {
  return res.locals.context as AuthorizationContext;
}
function id(req: Request): string {
  return z.uuid().parse(req.params.id);
}
function publicFailure(error: unknown): never {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  if (code === "VALIDATION_INPUT_UNAVAILABLE")
    throw new TrainingError(409, code);
  if (code === "NO_ACTIVE_VALIDATION_POLICY")
    throw new TrainingError(409, "UNAVAILABLE_PRODUCTION_CONTENT");
  if (
    [
      "PRESCRIPTION_NOT_DELIVERABLE",
      "TEST_PRESCRIPTION_NOT_DELIVERABLE",
    ].includes(code)
  )
    throw new TrainingError(409, "VALIDATION_REJECTION");
  if (code === "NOT_FOUND") throw new TrainingError(404, "NOT_FOUND");
  throw new TrainingError(409, "SESSION_REQUEST_UNAVAILABLE");
}

function facts(body: z.infer<typeof requestSchema>, demo: boolean) {
  const base = demo ? fixture(body.objective).request.facts : {};
  return {
    ...base,
    "safety.pain": body.restrictions.pain,
    "safety.progression_blocked": body.restrictions.pain,
    "restrictions.running_allowed": body.restrictions.running_allowed,
    "restrictions.jumping_allowed": body.restrictions.jumping_allowed,
    "restrictions.overhead_allowed": body.restrictions.overhead_allowed,
    "restrictions.loaded_carry_allowed": body.restrictions.loaded_carry_allowed,
    "restrictions.high_impact_allowed": body.restrictions.high_impact_allowed,
    "restrictions.deep_knee_flexion_allowed":
      body.restrictions.deep_knee_flexion_allowed,
    "restrictions.excluded_movements": body.restrictions.excluded_movements,
    "environment.surface_safe": body.environment_surface_safe,
    "equipment.available": body.equipment.available,
    "equipment.unsafe": body.equipment.unsafe,
    "environment.space": body.space,
    "readiness.state": demo
      ? (base["readiness.state"] ?? "UNKNOWN")
      : "UNKNOWN",
    "readiness.reasons": demo ? (base["readiness.reasons"] ?? []) : [],
    "load.soreness_high": demo
      ? (base["load.soreness_high"] ?? false)
      : "UNKNOWN",
    "program.phase": demo ? (base["program.phase"] ?? "UNKNOWN") : "UNKNOWN",
    "formation.supervised": false,
    "preferences.tags": body.preferences,
  };
}

async function consumerProjection(
  pool: pg.Pool,
  material: StoredMaterial,
  demo: boolean,
) {
  if (!material.session) throw new TrainingError(409, "NO_SAFE_PRESCRIPTION");
  const productionDetails = new Map<string, Record<string, unknown>>();
  if (!demo) {
    const ids = material.session.lines.map((line) => line.content_version);
    const rows = await pool.query<{
      id: string;
      payload: Record<string, unknown>;
    }>("SELECT id,payload FROM kb_versions WHERE id=ANY($1::uuid[])", [ids]);
    for (const row of rows.rows) productionDetails.set(row.id, row.payload);
  }
  return {
    demo,
    label: demo
      ? "SYNTHETIC DEMO — NOT PRODUCTION TRAINING"
      : "AUTHORIZED WORKOUT",
    prescription_id: material.prescription_id,
    objective: material.session.objective,
    duration_seconds: material.session.total_seconds,
    rationale: material.public_rationale,
    sections: material.session.sections,
    lines: material.session.lines.map((line, line_index) => {
      const candidate = catalog.find(
        (item) => item.content.content_version === line.content_version,
      );
      const detail = productionDetails.get(line.content_version);
      return {
        line_index,
        slot_id: line.slot_id,
        section: line.section,
        content_version: line.content_version,
        name: demo
          ? `Synthetic ${candidate?.content.movement ?? "exercise"} fixture`
          : String(detail?.name ?? "Authorized exercise"),
        purpose: demo
          ? "Software demonstration fixture; not training guidance."
          : String(detail?.summary ?? detail?.purpose ?? ""),
        setup_and_execution: demo
          ? "No production instruction is attached to this fixture."
          : String(detail?.instructions ?? detail?.typical_use ?? ""),
        cues: demo ? [] : (detail?.coaching_cues ?? []),
        common_faults: demo ? [] : (detail?.common_faults ?? []),
        cautions: demo ? [] : (detail?.cautions ?? []),
        equipment: candidate?.content.equipment ?? [],
        dose: line.dose,
        total_seconds: line.total_seconds,
        media: [],
        media_state: "NO_APPROVED_MEDIA",
      };
    }),
    provenance: material.provenance
      ? {
          rule_set_version: material.provenance.rule_set_version,
          template_version: material.provenance.template_version,
          content_versions: material.provenance.content_versions,
          training_date: material.provenance.training_date,
        }
      : null,
  };
}

async function readOwned(pool: pg.Pool, userId: string, sessionId: string) {
  const row = (
    await pool.query(
      "SELECT s.id,s.mode,s.synthetic,s.validation_status,s.entitlement_tier,s.consumer_snapshot,s.created_at,st.state,st.version,st.started_at,st.paused_at,st.ended_at,st.accumulated_ms,st.running_since,st.current_line,st.updated_at FROM workout_sessions s JOIN workout_session_state st ON st.session_id=s.id WHERE s.id=$1 AND s.actor_id=$2 AND st.actor_id=$2",
      [sessionId, userId],
    )
  ).rows[0];
  if (!row) throw new TrainingError(404, "NOT_FOUND");
  const actuals = (
    await pool.query(
      "SELECT id,prescribed_line_index,set_index,item_status,actual,substitution_id,supersedes_actual_id,recorded_at FROM workout_actuals WHERE session_id=$1 AND actor_id=$2 ORDER BY recorded_at,id",
      [sessionId, userId],
    )
  ).rows;
  const substitutions = (
    await pool.query(
      "SELECT id,prescribed_line_index,original_content_version,replacement_content_version,relationship_type,created_at FROM workout_substitutions WHERE session_id=$1 AND actor_id=$2 ORDER BY created_at,id",
      [sessionId, userId],
    )
  ).rows;
  return { ...row, actuals, substitutions };
}

async function createSession(
  config: ServerConfig,
  pool: pg.Pool,
  auth: AuthorizationContext,
  requestActor: Actor,
  raw: unknown,
  secret: string,
) {
  const body = requestSchema.parse(raw);
  const requestFingerprint = keyedFingerprint(
    secret,
    body,
    "formation-zero-execution-request-v1",
  );
  if (!(["BASE", "PERFORMANCE", "COMMAND"] as const).includes(auth.tier))
    throw new TrainingError(403, "ENTITLEMENT_DENIED");
  if (body.demo && !syntheticDemoAllowed(config.APP_ENV))
    throw new TrainingError(403, "DEMO_NOT_AVAILABLE");
  const existing = (
    await pool.query<{ id: string; request_fingerprint: string }>(
      "SELECT id,request_fingerprint FROM workout_sessions WHERE actor_id=$1 AND request_idempotency_key=$2",
      [requestActor.userId, body.idempotency_key],
    )
  ).rows[0];
  if (existing) {
    if (existing.request_fingerprint !== requestFingerprint)
      throw new TrainingError(409, "IDEMPOTENCY_CONFLICT");
    return readOwned(pool, requestActor.userId, existing.id);
  }

  const demo = body.demo;
  const fixtureContext = fixture(body.objective).request;
  const contextBody = {
    training_date: body.training_date,
    objective: body.objective,
    duration_seconds: body.duration_seconds,
    equipment: body.equipment,
    space: body.space,
    facts: facts(body, demo),
    candidate_scope: demo ? [] : body.candidate_scope,
    preferences: body.preferences,
    emphasis: [],
    relationship_requests: [],
    intensity_inputs: fixtureContext.intensity_inputs,
  };
  try {
    const prescription = await prescriptions.constructStored(
      pool,
      requestActor,
      demo
        ? {
            mode: "TEST",
            catalog_version: CATALOG_VERSION,
            context: contextBody,
          }
        : {
            mode: "PRODUCTION",
            template_version: body.template_version,
            context: contextBody,
          },
      secret,
      "CONSUMER",
    );
    const material = prescription.material as StoredMaterial;
    if (material.outcome !== "CANDIDATE_SESSION" || !material.session)
      throw new TrainingError(
        409,
        safeCodes.has(material.outcome)
          ? material.outcome
          : "NO_SAFE_PRESCRIPTION",
      );
    const validation = await validations.validateStored(
      pool,
      requestActor,
      { prescription_record_id: prescription.record_id },
      secret,
      "CONSUMER",
    );
    if (!["PASS", "WARN"].includes(validation.material.status))
      throw new TrainingError(409, "VALIDATION_REJECTION");
    const delivery = demo
      ? await validations.deliverDemo(
          pool,
          requestActor,
          prescription.record_id,
          secret,
        )
      : await validations.deliver(
          pool,
          requestActor,
          prescription.record_id,
          secret,
          "CONSUMER",
        );
    const projection = await consumerProjection(pool, material, demo);
    const sessionId = randomUUID();
    try {
      await transaction(pool, async (c) => {
        await c.query(
          "INSERT INTO workout_sessions(id,actor_id,prescription_record_id,validation_record_id,mode,synthetic,validation_status,entitlement_tier,prescription_snapshot,consumer_snapshot,request_idempotency_key,request_fingerprint) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
          [
            sessionId,
            requestActor.userId,
            delivery.prescription_record_id,
            delivery.validation_record_id,
            demo ? "DEMO" : "PRODUCTION",
            demo,
            delivery.validation_status,
            auth.tier,
            JSON.stringify(material),
            JSON.stringify(projection),
            body.idempotency_key,
            requestFingerprint,
          ],
        );
        await c.query(
          "INSERT INTO workout_session_state(session_id,actor_id,state) VALUES($1,$2,'NOT_STARTED')",
          [sessionId, requestActor.userId],
        );
        await c.query(
          "INSERT INTO workout_execution_events(id,session_id,actor_id,event_type,session_version,idempotency_key,payload) VALUES($1,$2,$3,'CREATED',0,$4,$5)",
          [
            randomUUID(),
            sessionId,
            requestActor.userId,
            body.idempotency_key,
            JSON.stringify({ mode: demo ? "DEMO" : "PRODUCTION" }),
          ],
        );
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        String(error.code) === "23505"
      ) {
        const winner = (
          await pool.query<{ id: string; request_fingerprint: string }>(
            "SELECT id,request_fingerprint FROM workout_sessions WHERE actor_id=$1 AND request_idempotency_key=$2",
            [requestActor.userId, body.idempotency_key],
          )
        ).rows[0];
        if (winner && winner.request_fingerprint === requestFingerprint)
          return readOwned(pool, requestActor.userId, winner.id);
        if (winner) throw new TrainingError(409, "IDEMPOTENCY_CONFLICT");
      }
      throw error;
    }
    return readOwned(pool, requestActor.userId, sessionId);
  } catch (error) {
    if (error instanceof TrainingError) throw error;
    publicFailure(error);
  }
}

async function mutateState(
  pool: pg.Pool,
  requestActor: Actor,
  sessionId: string,
  raw: unknown,
) {
  const body = transitionRequestSchema.parse(raw);
  await transaction(pool, async (c) => {
    const duplicate = (
      await c.query<{ session_id: string }>(
        "SELECT session_id FROM workout_execution_events WHERE actor_id=$1 AND idempotency_key=$2",
        [requestActor.userId, body.idempotency_key],
      )
    ).rows[0];
    if (duplicate) {
      if (duplicate.session_id !== sessionId)
        throw new TrainingError(409, "IDEMPOTENCY_CONFLICT");
      return;
    }
    const state = (
      await c.query<{
        state: ExecutionState;
        version: number;
        started_at: Date | null;
        accumulated_ms: string;
        running_since: Date | null;
      }>(
        "SELECT state,version,started_at,accumulated_ms,running_since FROM workout_session_state WHERE session_id=$1 AND actor_id=$2 FOR UPDATE",
        [sessionId, requestActor.userId],
      )
    ).rows[0];
    if (!state) throw new TrainingError(404, "NOT_FOUND");
    if (state.version !== body.expected_version)
      throw new TrainingError(409, "VERSION_CONFLICT");
    let next: ExecutionState;
    try {
      next = transition(state.state, body.action);
    } catch {
      throw new TrainingError(409, "INVALID_EXECUTION_TRANSITION");
    }
    const now = new Date();
    let accumulated = Number(state.accumulated_ms);
    if (state.running_since)
      accumulated += Math.max(0, now.getTime() - state.running_since.getTime());
    const running = next === "IN_PROGRESS" ? now : null;
    const started = body.action === "START" ? now : state.started_at;
    const ended = ["COMPLETED", "ABANDONED"].includes(next) ? now : null;
    const paused = next === "PAUSED" ? now : null;
    const version = state.version + 1;
    await c.query(
      "UPDATE workout_session_state SET state=$3,version=$4,started_at=$5,paused_at=$6,ended_at=$7,accumulated_ms=$8,running_since=$9,updated_at=$2 WHERE session_id=$1 AND actor_id=$10",
      [
        sessionId,
        now,
        next,
        version,
        started,
        paused,
        ended,
        accumulated,
        running,
        requestActor.userId,
      ],
    );
    await c.query(
      "INSERT INTO workout_execution_events(id,session_id,actor_id,event_type,session_version,idempotency_key,payload,recorded_at) VALUES($1,$2,$3,$4,$5,$6,'{}',$7)",
      [
        randomUUID(),
        sessionId,
        requestActor.userId,
        body.action === "START"
          ? "STARTED"
          : body.action === "RESUME"
            ? "RESUMED"
            : body.action + "D",
        version,
        body.idempotency_key,
        now,
      ],
    );
  });
  return readOwned(pool, requestActor.userId, sessionId);
}

async function writeActual(
  pool: pg.Pool,
  requestActor: Actor,
  sessionId: string,
  raw: unknown,
) {
  const body = actualWriteSchema.parse(raw);
  let actualId = "";
  await transaction(pool, async (c) => {
    const prior = (
      await c.query<{ id: string; session_id: string }>(
        "SELECT id,session_id FROM workout_actuals WHERE actor_id=$1 AND idempotency_key=$2",
        [requestActor.userId, body.idempotency_key],
      )
    ).rows[0];
    if (prior) {
      if (prior.session_id !== sessionId)
        throw new TrainingError(409, "IDEMPOTENCY_CONFLICT");
      actualId = prior.id;
      return;
    }
    const row = (
      await c.query<{
        version: number;
        state: ExecutionState;
        consumer_snapshot: { lines?: unknown[] };
      }>(
        "SELECT st.version,st.state,s.consumer_snapshot FROM workout_session_state st JOIN workout_sessions s ON s.id=st.session_id WHERE st.session_id=$1 AND st.actor_id=$2 FOR UPDATE OF st",
        [sessionId, requestActor.userId],
      )
    ).rows[0];
    if (!row) throw new TrainingError(404, "NOT_FOUND");
    if (row.version !== body.expected_version)
      throw new TrainingError(409, "VERSION_CONFLICT");
    if (!["IN_PROGRESS", "PAUSED"].includes(row.state))
      throw new TrainingError(409, "SESSION_NOT_ACTIVE");
    if (
      body.actual.prescribed_line_index >=
      (row.consumer_snapshot.lines?.length ?? 0)
    )
      throw new TrainingError(400, "INVALID_LINE_REFERENCE");
    if (body.supersedes_actual_id) {
      const superseded = (
        await c.query<{ prescribed_line_index: number }>(
          "SELECT prescribed_line_index FROM workout_actuals WHERE id=$1 AND session_id=$2 AND actor_id=$3",
          [body.supersedes_actual_id, sessionId, requestActor.userId],
        )
      ).rows[0];
      if (
        !superseded ||
        superseded.prescribed_line_index !== body.actual.prescribed_line_index
      )
        throw new TrainingError(409, "INVALID_CORRECTION_REFERENCE");
    }
    if (body.actual.substitution_id) {
      const substitution = await c.query(
        "SELECT 1 FROM workout_substitutions WHERE id=$1 AND session_id=$2 AND actor_id=$3 AND prescribed_line_index=$4",
        [
          body.actual.substitution_id,
          sessionId,
          requestActor.userId,
          body.actual.prescribed_line_index,
        ],
      );
      if (!substitution.rowCount)
        throw new TrainingError(409, "UNAUTHORIZED_SUBSTITUTION");
    }
    actualId = randomUUID();
    const version = row.version + 1;
    await c.query(
      "INSERT INTO workout_actuals(id,session_id,actor_id,prescribed_line_index,set_index,item_status,actual,substitution_id,supersedes_actual_id,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        actualId,
        sessionId,
        requestActor.userId,
        body.actual.prescribed_line_index,
        body.actual.set_index,
        body.actual.item_status,
        JSON.stringify(body.actual),
        body.actual.substitution_id,
        body.supersedes_actual_id,
        body.idempotency_key,
      ],
    );
    await c.query(
      "UPDATE workout_session_state SET version=$3,updated_at=now() WHERE session_id=$1 AND actor_id=$2",
      [sessionId, requestActor.userId, version],
    );
    await c.query(
      "INSERT INTO workout_execution_events(id,session_id,actor_id,event_type,session_version,idempotency_key,payload) VALUES($1,$2,$3,'ACTUAL_RECORDED',$4,$5,$6)",
      [
        randomUUID(),
        sessionId,
        requestActor.userId,
        version,
        body.idempotency_key,
        JSON.stringify({
          actual_id: actualId,
          line_index: body.actual.prescribed_line_index,
        }),
      ],
    );
  });
  return {
    actual_id: actualId,
    session: await readOwned(pool, requestActor.userId, sessionId),
  };
}

async function movePosition(
  pool: pg.Pool,
  requestActor: Actor,
  sessionId: string,
  raw: unknown,
) {
  const body = positionSchema.parse(raw);
  await transaction(pool, async (c) => {
    const duplicate = await c.query<{ session_id: string }>(
      "SELECT session_id FROM workout_execution_events WHERE actor_id=$1 AND idempotency_key=$2",
      [requestActor.userId, body.idempotency_key],
    );
    if (duplicate.rows[0]) {
      if (duplicate.rows[0].session_id !== sessionId)
        throw new TrainingError(409, "IDEMPOTENCY_CONFLICT");
      return;
    }
    const row = (
      await c.query<{
        version: number;
        state: string;
        consumer_snapshot: { lines?: unknown[] };
      }>(
        "SELECT st.version,st.state,s.consumer_snapshot FROM workout_session_state st JOIN workout_sessions s ON s.id=st.session_id WHERE st.session_id=$1 AND st.actor_id=$2 FOR UPDATE OF st",
        [sessionId, requestActor.userId],
      )
    ).rows[0];
    if (!row) throw new TrainingError(404, "NOT_FOUND");
    if (row.version !== body.expected_version)
      throw new TrainingError(409, "VERSION_CONFLICT");
    if (
      !["IN_PROGRESS", "PAUSED"].includes(row.state) ||
      body.line_index >= (row.consumer_snapshot.lines?.length ?? 0)
    )
      throw new TrainingError(409, "INVALID_POSITION");
    const version = row.version + 1;
    await c.query(
      "UPDATE workout_session_state SET current_line=$3,version=$4,updated_at=now() WHERE session_id=$1 AND actor_id=$2",
      [sessionId, requestActor.userId, body.line_index, version],
    );
    await c.query(
      "INSERT INTO workout_execution_events(id,session_id,actor_id,event_type,session_version,idempotency_key,payload) VALUES($1,$2,$3,'POSITION_CHANGED',$4,$5,$6)",
      [
        randomUUID(),
        sessionId,
        requestActor.userId,
        version,
        body.idempotency_key,
        JSON.stringify({ line_index: body.line_index }),
      ],
    );
  });
  return readOwned(pool, requestActor.userId, sessionId);
}

async function safetyStop(
  pool: pg.Pool,
  requestActor: Actor,
  sessionId: string,
  raw: unknown,
) {
  const body = safetyChangeSchema.parse(raw);
  await transaction(pool, async (c) => {
    const duplicate = await c.query<{ session_id: string }>(
      "SELECT session_id FROM workout_execution_events WHERE actor_id=$1 AND idempotency_key=$2",
      [requestActor.userId, body.idempotency_key],
    );
    if (duplicate.rows[0]) {
      if (duplicate.rows[0].session_id !== sessionId)
        throw new TrainingError(409, "IDEMPOTENCY_CONFLICT");
      return;
    }
    const row = (
      await c.query<{
        version: number;
        state: ExecutionState;
        started_at: Date | null;
        accumulated_ms: string;
        running_since: Date | null;
      }>(
        "SELECT version,state,started_at,accumulated_ms,running_since FROM workout_session_state WHERE session_id=$1 AND actor_id=$2 FOR UPDATE",
        [sessionId, requestActor.userId],
      )
    ).rows[0];
    if (!row) throw new TrainingError(404, "NOT_FOUND");
    if (row.version !== body.expected_version)
      throw new TrainingError(409, "VERSION_CONFLICT");
    if (!["IN_PROGRESS", "PAUSED"].includes(row.state))
      throw new TrainingError(409, "SESSION_NOT_ACTIVE");
    const now = new Date();
    const accumulated =
      Number(row.accumulated_ms) +
      (row.running_since
        ? Math.max(0, now.getTime() - row.running_since.getTime())
        : 0);
    const version = row.version + 1;
    await c.query(
      "UPDATE workout_session_state SET state='ABANDONED',version=$3,ended_at=$4,paused_at=NULL,running_since=NULL,accumulated_ms=$5,updated_at=$4 WHERE session_id=$1 AND actor_id=$2",
      [sessionId, requestActor.userId, version, now, accumulated],
    );
    await c.query(
      "INSERT INTO workout_execution_events(id,session_id,actor_id,event_type,session_version,idempotency_key,payload,recorded_at) VALUES($1,$2,$3,'SAFETY_STOPPED',$4,$5,$6,$7)",
      [
        randomUUID(),
        sessionId,
        requestActor.userId,
        version,
        body.idempotency_key,
        JSON.stringify({
          kind: body.kind,
          public_message:
            "The session was stopped. Review the new information before requesting another session.",
        }),
        now,
      ],
    );
  });
  return readOwned(pool, requestActor.userId, sessionId);
}

async function substitute(
  pool: pg.Pool,
  requestActor: Actor,
  sessionId: string,
  raw: unknown,
  secret: string,
) {
  const body = substitutionRequestSchema.parse(raw);
  const session = (await readOwned(pool, requestActor.userId, sessionId)) as {
    mode: string;
    state: string;
    version: number;
    consumer_snapshot: { lines: { content_version: string }[] };
  };
  if (session.version !== body.expected_version)
    throw new TrainingError(409, "VERSION_CONFLICT");
  if (!["IN_PROGRESS", "PAUSED"].includes(session.state))
    throw new TrainingError(409, "SESSION_NOT_ACTIVE");
  const original = session.consumer_snapshot.lines[body.prescribed_line_index];
  if (!original) throw new TrainingError(400, "INVALID_LINE_REFERENCE");
  const prescriptionRow = (
    await pool.query<{ prescription_record_id: string }>(
      "SELECT prescription_record_id FROM workout_sessions WHERE id=$1 AND actor_id=$2",
      [sessionId, requestActor.userId],
    )
  ).rows[0]!;
  const sealed = (
    await pool.query<{ validation_input: Buffer }>(
      "SELECT validation_input FROM prescriptions WHERE id=$1 AND actor_id=$2",
      [prescriptionRow.prescription_record_id, requestActor.userId],
    )
  ).rows[0];
  if (!sealed?.validation_input)
    throw new TrainingError(409, "VALIDATION_INPUT_UNAVAILABLE");
  const construction = openValidationInput(secret, sealed.validation_input) as {
    request: Record<string, unknown>;
    template: { version_id: string };
  };
  const request = {
    ...construction.request,
    relationship_requests: [
      { from_version: original.content_version, type: body.relationship_type },
    ],
  };
  try {
    const prescription = await prescriptions.constructStored(
      pool,
      requestActor,
      session.mode === "DEMO"
        ? {
            mode: "TEST",
            catalog_version: CATALOG_VERSION,
            context: Object.fromEntries(
              Object.entries(request).filter(
                ([key]) => !["mode", "individual_ref"].includes(key),
              ),
            ),
          }
        : {
            mode: "PRODUCTION",
            template_version: construction.template.version_id,
            context: Object.fromEntries(
              Object.entries(request).filter(
                ([key]) => !["mode", "individual_ref"].includes(key),
              ),
            ),
          },
      secret,
      "CONSUMER",
    );
    if (
      (prescription.material as StoredMaterial).outcome !== "CANDIDATE_SESSION"
    )
      throw new TrainingError(409, "NO_SAFE_SUBSTITUTION");
    const validation = await validations.validateStored(
      pool,
      requestActor,
      { prescription_record_id: prescription.record_id },
      secret,
      "CONSUMER",
    );
    if (!["PASS", "WARN"].includes(validation.material.status))
      throw new TrainingError(409, "NO_SAFE_SUBSTITUTION");
    const delivery =
      session.mode === "DEMO"
        ? await validations.deliverDemo(
            pool,
            requestActor,
            prescription.record_id,
            secret,
          )
        : await validations.deliver(
            pool,
            requestActor,
            prescription.record_id,
            secret,
            "CONSUMER",
          );
    const replacement = (
      prescription.material as StoredMaterial
    ).session?.lines.find(
      (line) =>
        line.content_version !== original.content_version &&
        (line as { selection_reasons?: string[] }).selection_reasons?.includes(
          "EXPLICIT_RELATIONSHIP",
        ),
    );
    if (!replacement) throw new TrainingError(409, "NO_SAFE_SUBSTITUTION");
    let substitutionId = "";
    await transaction(pool, async (c) => {
      const duplicate = (
        await c.query<{ id: string; session_id: string }>(
          "SELECT id,session_id FROM workout_substitutions WHERE actor_id=$1 AND idempotency_key=$2",
          [requestActor.userId, body.idempotency_key],
        )
      ).rows[0];
      if (duplicate) {
        if (duplicate.session_id !== sessionId)
          throw new TrainingError(409, "IDEMPOTENCY_CONFLICT");
        substitutionId = duplicate.id;
        return;
      }
      const locked = (
        await c.query<{ version: number }>(
          "SELECT version FROM workout_session_state WHERE session_id=$1 AND actor_id=$2 FOR UPDATE",
          [sessionId, requestActor.userId],
        )
      ).rows[0];
      if (!locked) throw new TrainingError(404, "NOT_FOUND");
      if (locked.version !== body.expected_version)
        throw new TrainingError(409, "VERSION_CONFLICT");
      substitutionId = randomUUID();
      const version = locked.version + 1;
      await c.query(
        "INSERT INTO workout_substitutions(id,session_id,actor_id,prescribed_line_index,original_content_version,replacement_content_version,relationship_type,replacement_prescription_record_id,replacement_validation_record_id,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [
          substitutionId,
          sessionId,
          requestActor.userId,
          body.prescribed_line_index,
          original.content_version,
          replacement.content_version,
          body.relationship_type,
          delivery.prescription_record_id,
          delivery.validation_record_id,
          body.idempotency_key,
        ],
      );
      await c.query(
        "UPDATE workout_session_state SET version=$3,updated_at=now() WHERE session_id=$1 AND actor_id=$2",
        [sessionId, requestActor.userId, version],
      );
      await c.query(
        "INSERT INTO workout_execution_events(id,session_id,actor_id,event_type,session_version,idempotency_key,payload) VALUES($1,$2,$3,'SUBSTITUTED',$4,$5,$6)",
        [
          randomUUID(),
          sessionId,
          requestActor.userId,
          version,
          body.idempotency_key,
          JSON.stringify({
            substitution_id: substitutionId,
            line_index: body.prescribed_line_index,
          }),
        ],
      );
    });
    return {
      substitution_id: substitutionId,
      session: await readOwned(pool, requestActor.userId, sessionId),
    };
  } catch (error) {
    if (error instanceof TrainingError) throw error;
    publicFailure(error);
  }
}

async function history(pool: pg.Pool, requestActor: Actor, raw: unknown) {
  const filter = historyFilterSchema.parse(raw);
  const values: unknown[] = [requestActor.userId];
  const where = ["s.actor_id=$1", "st.state IN ('COMPLETED','ABANDONED')"];
  if (filter.status) {
    values.push(filter.status);
    where.push(`st.state=$${values.length}`);
  }
  if (filter.objective) {
    values.push(filter.objective);
    where.push(`s.consumer_snapshot->>'objective'=$${values.length}`);
  }
  if (filter.from) {
    values.push(filter.from);
    where.push(`s.created_at >= $${values.length}::date`);
  }
  if (filter.to) {
    values.push(filter.to);
    where.push(`s.created_at < ($${values.length}::date + interval '1 day')`);
  }
  values.push(filter.limit);
  return (
    await pool.query(
      `SELECT s.id,s.mode,s.consumer_snapshot->>'objective' objective,s.consumer_snapshot->>'duration_seconds' prescribed_duration_seconds,s.created_at,st.state,st.started_at,st.ended_at,st.accumulated_ms FROM workout_sessions s JOIN workout_session_state st ON st.session_id=s.id WHERE ${where.join(" AND ")} ORDER BY COALESCE(st.ended_at,s.created_at) DESC,s.id LIMIT $${values.length}`,
      values,
    )
  ).rows;
}

export function trainingRouter(
  config: ServerConfig,
  pool: pg.Pool,
  secret: string,
) {
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, private");
    next();
  });
  router.post("/sessions", async (req, res) =>
    res
      .status(201)
      .json(
        await createSession(
          config,
          pool,
          context(res),
          actor(res),
          req.body,
          secret,
        ),
      ),
  );
  router.get("/sessions", async (req, res) =>
    res.json(await history(pool, actor(res), req.query)),
  );
  router.get("/sessions/:id", async (req, res) =>
    res.json(await readOwned(pool, actor(res).userId, id(req))),
  );
  router.post("/sessions/:id/transitions", async (req, res) =>
    res.json(await mutateState(pool, actor(res), id(req), req.body)),
  );
  router.post("/sessions/:id/actuals", async (req, res) =>
    res
      .status(201)
      .json(await writeActual(pool, actor(res), id(req), req.body)),
  );
  router.post("/sessions/:id/substitutions", async (req, res) =>
    res
      .status(201)
      .json(await substitute(pool, actor(res), id(req), req.body, secret)),
  );
  router.post("/sessions/:id/safety-changes", async (req, res) =>
    res.json(await safetyStop(pool, actor(res), id(req), req.body)),
  );
  router.patch("/sessions/:id/position", async (req, res) =>
    res.json(await movePosition(pool, actor(res), id(req), req.body)),
  );
  router.use(
    (error: unknown, _req: Request, res: Response, next: NextFunction) => {
      if (error instanceof TrainingError) {
        res.status(error.status).json({
          error: { code: error.code, requestId: res.locals.requestId },
        });
        return;
      }
      next(error);
    },
  );
  return router;
}
