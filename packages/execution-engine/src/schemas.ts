import { z } from "zod";

export const EXECUTION_STATES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETED",
  "ABANDONED",
] as const;
export const executionStateSchema = z.enum(EXECUTION_STATES);
export type ExecutionState = z.infer<typeof executionStateSchema>;

const idempotencyKey = z
  .string()
  .min(8)
  .max(100)
  .regex(/^[A-Za-z0-9._:-]+$/);
export const transitionRequestSchema = z
  .object({
    action: z.enum(["START", "PAUSE", "RESUME", "COMPLETE", "ABANDON"]),
    expected_version: z.number().int().nonnegative(),
    idempotency_key: idempotencyKey,
    client_timestamp: z.iso.datetime().optional(),
  })
  .strict();

export const actualPerformanceSchema = z
  .object({
    prescribed_line_index: z.number().int().nonnegative().max(99),
    set_index: z.number().int().nonnegative().max(999).nullable().default(null),
    item_status: z.enum(["COMPLETED", "SKIPPED", "PARTIAL"]),
    sets: z.number().int().nonnegative().max(1000).nullable().default(null),
    reps: z.number().int().nonnegative().max(100000).nullable().default(null),
    load_kg: z
      .number()
      .finite()
      .nonnegative()
      .max(2000)
      .nullable()
      .default(null),
    duration_seconds: z
      .number()
      .int()
      .nonnegative()
      .max(86400)
      .nullable()
      .default(null),
    distance_meters: z
      .number()
      .finite()
      .nonnegative()
      .max(500000)
      .nullable()
      .default(null),
    intervals: z
      .number()
      .int()
      .nonnegative()
      .max(10000)
      .nullable()
      .default(null),
    rounds: z.number().int().nonnegative().max(10000).nullable().default(null),
    rest_seconds: z
      .number()
      .int()
      .nonnegative()
      .max(14400)
      .nullable()
      .default(null),
    perceived_effort: z.number().int().min(1).max(10).nullable().default(null),
    notes: z.string().trim().max(1000).nullable().default(null),
    substitution_id: z.uuid().nullable().default(null),
  })
  .strict();

export const actualWriteSchema = z
  .object({
    expected_version: z.number().int().nonnegative(),
    idempotency_key: idempotencyKey,
    actual: actualPerformanceSchema,
    supersedes_actual_id: z.uuid().nullable().default(null),
  })
  .strict();

export const substitutionRequestSchema = z
  .object({
    expected_version: z.number().int().nonnegative(),
    idempotency_key: idempotencyKey,
    prescribed_line_index: z.number().int().nonnegative().max(99),
    relationship_type: z.enum(["SUBSTITUTION", "REGRESSION", "PROGRESSION"]),
  })
  .strict();

export const safetyChangeSchema = z
  .object({
    expected_version: z.number().int().nonnegative(),
    idempotency_key: idempotencyKey,
    kind: z.enum(["NEW_RESTRICTION", "PAIN", "ENVIRONMENT_UNSAFE"]),
  })
  .strict();

export const historyFilterSchema = z
  .object({
    status: z.enum(["COMPLETED", "ABANDONED"]).optional(),
    objective: z.string().min(1).max(100).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

export const offlineCommandSchema = z
  .object({
    idempotency_key: idempotencyKey,
    session_id: z.uuid(),
    kind: z.enum(["TRANSITION", "ACTUAL"]),
    body: z.unknown(),
    queued_at: z.number().int().nonnegative(),
  })
  .strict();

export type ActualPerformance = z.infer<typeof actualPerformanceSchema>;
export type OfflineCommand = z.infer<typeof offlineCommandSchema>;
