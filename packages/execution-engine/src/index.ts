import {
  offlineCommandSchema,
  type ExecutionState,
  type OfflineCommand,
} from "./schemas.js";
export * from "./schemas.js";

export const ENGINE_VERSION = "1.0.0";
export const OFFLINE_RETENTION_MS = 24 * 60 * 60 * 1000;
export const OFFLINE_QUEUE_LIMIT = 100;

export function syntheticDemoAllowed(environment: string): boolean {
  return environment !== "PRODUCTION";
}

const transitions: Readonly<
  Record<ExecutionState, Readonly<Record<string, ExecutionState>>>
> = {
  NOT_STARTED: { START: "IN_PROGRESS" },
  IN_PROGRESS: {
    PAUSE: "PAUSED",
    COMPLETE: "COMPLETED",
    ABANDON: "ABANDONED",
  },
  PAUSED: {
    RESUME: "IN_PROGRESS",
    COMPLETE: "COMPLETED",
    ABANDON: "ABANDONED",
  },
  COMPLETED: {},
  ABANDONED: {},
};

export function transition(
  state: ExecutionState,
  action: string,
): ExecutionState {
  const next = transitions[state][action];
  if (!next) throw new Error("INVALID_EXECUTION_TRANSITION");
  return next;
}

export type TimerState = {
  accumulated_ms: number;
  running_since_epoch_ms: number | null;
};

export function timerStart(now: number): TimerState {
  return { accumulated_ms: 0, running_since_epoch_ms: now };
}
export function timerPause(timer: TimerState, now: number): TimerState {
  return {
    accumulated_ms: elapsedMilliseconds(timer, now),
    running_since_epoch_ms: null,
  };
}
export function timerResume(timer: TimerState, now: number): TimerState {
  return timer.running_since_epoch_ms === null
    ? { ...timer, running_since_epoch_ms: now }
    : timer;
}
export function elapsedMilliseconds(timer: TimerState, now: number): number {
  return Math.max(
    0,
    timer.accumulated_ms +
      (timer.running_since_epoch_ms === null
        ? 0
        : Math.max(0, now - timer.running_since_epoch_ms)),
  );
}

export type OfflineEnvelope<T> = {
  user_id: string;
  session: T;
  expires_at: number;
  queue: OfflineCommand[];
};

export function createOfflineEnvelope<T>(
  userId: string,
  session: T,
  now: number,
): OfflineEnvelope<T> {
  return {
    user_id: userId,
    session,
    expires_at: now + OFFLINE_RETENTION_MS,
    queue: [],
  };
}
export function readOfflineEnvelope<T>(
  envelope: OfflineEnvelope<T> | null,
  userId: string,
  now: number,
): OfflineEnvelope<T> | null {
  if (!envelope || envelope.user_id !== userId || envelope.expires_at <= now)
    return null;
  return envelope;
}
export function queueOffline<T>(
  envelope: OfflineEnvelope<T>,
  raw: OfflineCommand,
): OfflineEnvelope<T> {
  const command = offlineCommandSchema.parse(raw);
  if (
    envelope.queue.some(
      (item) => item.idempotency_key === command.idempotency_key,
    )
  )
    return envelope;
  if (envelope.queue.length >= OFFLINE_QUEUE_LIMIT)
    throw new Error("OFFLINE_QUEUE_FULL");
  return { ...envelope, queue: [...envelope.queue, command] };
}
