import { test } from "node:test";
import assert from "node:assert/strict";
import {
  actualPerformanceSchema,
  createOfflineEnvelope,
  elapsedMilliseconds,
  OFFLINE_QUEUE_LIMIT,
  queueOffline,
  readOfflineEnvelope,
  syntheticDemoAllowed,
  timerPause,
  timerResume,
  timerStart,
  transition,
} from "@formation-zero/execution-engine";

test("F deterministic execution transitions reject invalid terminal changes", () => {
  assert.equal(transition("NOT_STARTED", "START"), "IN_PROGRESS");
  assert.equal(transition("IN_PROGRESS", "PAUSE"), "PAUSED");
  assert.equal(transition("PAUSED", "RESUME"), "IN_PROGRESS");
  assert.equal(transition("IN_PROGRESS", "COMPLETE"), "COMPLETED");
  assert.equal(transition("PAUSED", "ABANDON"), "ABANDONED");
  assert.throws(
    () => transition("NOT_STARTED", "COMPLETE"),
    /INVALID_EXECUTION_TRANSITION/,
  );
  assert.throws(
    () => transition("COMPLETED", "START"),
    /INVALID_EXECUTION_TRANSITION/,
  );
  assert.throws(
    () => transition("ABANDONED", "RESUME"),
    /INVALID_EXECUTION_TRANSITION/,
  );
});

test("F timer uses absolute elapsed time and survives pause/background recovery", () => {
  const started = timerStart(1_000);
  assert.equal(elapsedMilliseconds(started, 6_000), 5_000);
  const paused = timerPause(started, 6_000);
  assert.equal(elapsedMilliseconds(paused, 60_000), 5_000);
  const resumed = timerResume(paused, 70_000);
  assert.equal(elapsedMilliseconds(resumed, 73_000), 8_000);
  assert.equal(elapsedMilliseconds(timerStart(10_000), 5_000), 0);
});

test("F actual performance is bounded and cannot contain authoritative prescription fields", () => {
  const actual = actualPerformanceSchema.parse({
    prescribed_line_index: 0,
    item_status: "PARTIAL",
    sets: 2,
    reps: 8,
    load_kg: 20,
    duration_seconds: 90,
    distance_meters: 100,
    intervals: 3,
    rounds: 2,
    rest_seconds: 60,
    perceived_effort: 7,
    notes: "Private factual note",
  });
  assert.equal(actual.reps, 8);
  assert.equal(actual.substitution_id, null);
  assert.equal(
    actualPerformanceSchema.safeParse({
      prescribed_line_index: 0,
      item_status: "COMPLETED",
      validation_status: "PASS",
    }).success,
    false,
  );
  assert.equal(
    actualPerformanceSchema.safeParse({
      prescribed_line_index: 0,
      item_status: "COMPLETED",
      notes: "x".repeat(1001),
    }).success,
    false,
  );
});

test("F offline envelope is user-scoped, expires, deduplicates and is bounded", () => {
  let envelope = createOfflineEnvelope("user-a", { id: "safe-session" }, 1_000);
  assert.equal(readOfflineEnvelope(envelope, "user-b", 1_001), null);
  assert.equal(
    readOfflineEnvelope(envelope, "user-a", envelope.expires_at),
    null,
  );
  for (let i = 0; i < OFFLINE_QUEUE_LIMIT; i++)
    envelope = queueOffline(envelope, {
      idempotency_key: `offline-${String(i).padStart(3, "0")}`,
      session_id: "00000000-0000-4000-8000-000000000001",
      kind: "ACTUAL",
      body: {},
      queued_at: i,
    });
  assert.equal(envelope.queue.length, OFFLINE_QUEUE_LIMIT);
  assert.equal(
    queueOffline(envelope, envelope.queue[0]!).queue.length,
    OFFLINE_QUEUE_LIMIT,
  );
  assert.throws(
    () =>
      queueOffline(envelope, {
        ...envelope.queue[0]!,
        idempotency_key: "offline-overflow",
      }),
    /OFFLINE_QUEUE_FULL/,
  );
});

test("F synthetic demo authority is unavailable in production", () => {
  assert.equal(syntheticDemoAllowed("LOCAL"), true);
  assert.equal(syntheticDemoAllowed("TEST"), true);
  assert.equal(syntheticDemoAllowed("STAGING"), true);
  assert.equal(syntheticDemoAllowed("PRODUCTION"), false);
});
