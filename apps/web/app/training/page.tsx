"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type Line = {
  line_index: number;
  section: string;
  name: string;
  purpose: string;
  setup_and_execution: string;
  cues: string[];
  common_faults: string[];
  cautions: string[];
  equipment: string[];
  dose: unknown;
  total_seconds: number;
  media: unknown[];
  media_state: string;
};
type Session = {
  id: string;
  mode: string;
  state: string;
  version: number;
  current_line: number;
  accumulated_ms: string | number;
  running_since: string | null;
  consumer_snapshot: {
    demo: boolean;
    label: string;
    objective: string;
    duration_seconds: number;
    rationale: string;
    lines: Line[];
  };
  actuals: unknown[];
  substitutions: unknown[];
};
type Account = { userId: string };
const cacheKey = "fz.phase-f.active";
const queueKey = "fz.phase-f.queue";
const safeMessage: Record<string, string> = {
  NO_SAFE_PRESCRIPTION:
    "No safe session is available for the supplied information.",
  REQUIRED_FACT_UNKNOWN:
    "Required information is unavailable. The server did not create a workout.",
  INSUFFICIENT_ELIGIBLE_CONTENT: "No eligible content is currently available.",
  INSUFFICIENT_TIME:
    "The requested duration cannot contain the required session structure.",
  REQUIRED_EQUIPMENT_UNAVAILABLE:
    "The required equipment is unavailable or marked unsafe.",
  CONTENT_NOT_PRODUCTION_ELIGIBLE:
    "Production training content is not yet available.",
  UNAVAILABLE_PRODUCTION_CONTENT: "Production training is not yet available.",
  VALIDATION_REJECTION: "Independent validation withheld this workout.",
  VALIDATION_INPUT_UNAVAILABLE:
    "The required sealed validation context is unavailable.",
  ENTITLEMENT_DENIED: "This account is not entitled to this action.",
  VERSION_CONFLICT: "This session changed elsewhere. Reload before continuing.",
  SERVICE_UNAVAILABLE:
    "The training service is unavailable. An active downloaded session can continue offline.",
};
const key = () => globalThis.crypto.randomUUID();

export default function TrainingPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState(
    "Sign in, then request a server-authorized session.",
  );
  const [today, setToday] = useState("");
  const [now, setNow] = useState(Date.now());
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
    fetch("/api/account/account", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<Account>;
      })
      .then((value) => {
        const previous = localStorage.getItem("fz.phase-f.user");
        if (previous && previous !== value.userId) {
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(queueKey);
        }
        localStorage.setItem("fz.phase-f.user", value.userId);
        setAccount(value);
        const cached = JSON.parse(localStorage.getItem(cacheKey) ?? "null") as {
          user_id?: string;
          expires_at?: number;
          session?: Session;
        } | null;
        if (
          cached?.user_id === value.userId &&
          Number(cached.expires_at) > Date.now() &&
          cached.session
        ) {
          setSession(cached.session);
          setMessage(
            "Downloaded active session restored. Server authority will be checked on synchronization.",
          );
        }
      })
      .catch(() => setMessage("Sign in to request or review training."));
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (
      account &&
      session &&
      ["NOT_STARTED", "IN_PROGRESS", "PAUSED"].includes(session.state)
    )
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          user_id: account.userId,
          expires_at: Date.now() + 86400000,
          session: { ...session, actuals: [], substitutions: [] },
        }),
      );
    else if (session && ["COMPLETED", "ABANDONED"].includes(session.state))
      localStorage.removeItem(cacheKey);
  }, [account, session]);
  const elapsed = useMemo(
    () =>
      Number(session?.accumulated_ms ?? 0) +
      (session?.running_since
        ? Math.max(0, now - new Date(session.running_since).getTime())
        : 0),
    [session, now],
  );

  async function api(path: string, method = "GET", body?: unknown) {
    const response = await fetch(`/api/training/${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(String(data.error?.code ?? "SERVICE_UNAVAILABLE"));
    return data;
  }
  function report(error: unknown) {
    const code = error instanceof Error ? error.message : "SERVICE_UNAVAILABLE";
    setMessage(
      safeMessage[code] ?? "The request could not be completed safely.",
    );
  }
  async function requestSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const result = await api("sessions", "POST", {
        idempotency_key: key(),
        demo: data.get("demo") === "on",
        training_date: data.get("date"),
        objective: data.get("objective"),
        duration_seconds: Number(data.get("duration")) * 60,
        equipment: { available: [], unsafe: [] },
        space: data.get("space"),
        restrictions: {},
        preferences: [],
        candidate_scope: [],
      });
      setSession(result);
      setMessage(result.consumer_snapshot.label);
    } catch (error) {
      report(error);
    }
  }
  async function command(action: string) {
    if (!session) return;
    const body = {
      action,
      expected_version: session.version,
      idempotency_key: key(),
      client_timestamp: new Date().toISOString(),
    };
    try {
      setSession(await api(`sessions/${session.id}/transitions`, "POST", body));
      setMessage(`${action.toLowerCase()} recorded by the server.`);
    } catch (error) {
      if (
        error instanceof TypeError &&
        ["IN_PROGRESS", "PAUSED"].includes(session.state)
      ) {
        const queue = JSON.parse(localStorage.getItem(queueKey) ?? "[]") as {
          session_id: string;
        }[];
        const expected =
          session.version +
          queue.filter((item) => item.session_id === session.id).length;
        if (queue.length < 100)
          localStorage.setItem(
            queueKey,
            JSON.stringify([
              ...queue,
              {
                session_id: session.id,
                kind: "TRANSITION",
                path: `sessions/${session.id}/transitions`,
                body: { ...body, expected_version: expected },
                idempotency_key: body.idempotency_key,
                queued_at: Date.now(),
              },
            ]),
          );
        setMessage(
          "Network unavailable. The idempotent action is queued for synchronization.",
        );
      } else report(error);
    }
  }
  async function record(status: "COMPLETED" | "SKIPPED") {
    if (!session) return;
    try {
      const result = await api(`sessions/${session.id}/actuals`, "POST", {
        expected_version: session.version,
        idempotency_key: key(),
        actual: {
          prescribed_line_index: session.current_line,
          item_status: status,
        },
      });
      setSession(result.session);
      setMessage(
        status === "SKIPPED"
          ? "Skip recorded as actual performance."
          : "Actual performance recorded separately from the prescription.",
      );
    } catch (error) {
      if (
        error instanceof TypeError &&
        ["IN_PROGRESS", "PAUSED"].includes(session.state)
      ) {
        const queue = JSON.parse(localStorage.getItem(queueKey) ?? "[]") as {
          session_id: string;
        }[];
        const expected =
          session.version +
          queue.filter((item) => item.session_id === session.id).length;
        const idempotencyKey = key();
        if (queue.length < 100)
          localStorage.setItem(
            queueKey,
            JSON.stringify([
              ...queue,
              {
                session_id: session.id,
                kind: "ACTUAL",
                path: `sessions/${session.id}/actuals`,
                body: {
                  expected_version: expected,
                  idempotency_key: idempotencyKey,
                  actual: {
                    prescribed_line_index: session.current_line,
                    item_status: status,
                  },
                },
                idempotency_key: idempotencyKey,
                queued_at: Date.now(),
              },
            ]),
          );
        setMessage(
          "Network unavailable. Actual performance is queued without changing the prescription.",
        );
      } else report(error);
    }
  }
  async function synchronize() {
    const queue = JSON.parse(localStorage.getItem(queueKey) ?? "[]") as {
      path: string;
      body: unknown;
    }[];
    let completed = 0;
    try {
      for (const item of queue) {
        const result = await api(item.path, "POST", item.body);
        setSession(result.session ?? result);
        completed++;
      }
      localStorage.removeItem(queueKey);
      setMessage(
        `${completed} queued action${completed === 1 ? "" : "s"} synchronized.`,
      );
    } catch (error) {
      localStorage.setItem(queueKey, JSON.stringify(queue.slice(completed)));
      report(error);
    }
  }
  async function loadHistory() {
    try {
      setHistory(await api("sessions?limit=25"));
      setMessage("Private session history loaded.");
    } catch (error) {
      report(error);
    }
  }
  const line = session?.consumer_snapshot.lines[session.current_line];
  return (
    <main className="fz-training" id="main-content">
      <p className="fz-eyebrow">Individual training</p>
      <h2>Execute the authorized plan. Record what happened.</h2>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {!session && (
        <form
          className="fz-form"
          onSubmit={requestSession}
          aria-label="Request an individual session"
        >
          <label>
            Date
            <input
              name="date"
              type="date"
              value={today}
              onChange={(event) => setToday(event.target.value)}
              required
            />
          </label>
          <label>
            Objective
            <select name="objective" defaultValue="GENERAL_READINESS">
              <option>GENERAL_READINESS</option>
              <option>STRENGTH</option>
              <option>RUNNING</option>
              <option>RUCKING</option>
              <option>HYBRID</option>
              <option>MOBILITY</option>
              <option>RECOVERY</option>
            </select>
          </label>
          <label>
            Duration in minutes
            <input
              name="duration"
              type="number"
              min="5"
              max="240"
              defaultValue="45"
              required
            />
          </label>
          <label>
            Space
            <select name="space" defaultValue="STANDARD">
              <option>STANDARD</option>
              <option>LIMITED</option>
              <option>UNKNOWN</option>
            </select>
          </label>
          <label className="fz-check">
            <input name="demo" type="checkbox" /> Use isolated synthetic demo
            content
          </label>
          <button type="submit" disabled={!account}>
            Request authorized session
          </button>
        </form>
      )}
      {session && (
        <section className="fz-workout" aria-label="Authorized workout">
          <div className="fz-session-heading">
            <div>
              <span className="fz-badge">
                {session.consumer_snapshot.label}
              </span>
              <h3>
                {session.consumer_snapshot.objective.replaceAll("_", " ")}
              </h3>
              <p>{session.consumer_snapshot.rationale}</p>
            </div>
            <div
              className="fz-timer"
              role="timer"
              aria-label={`Elapsed time ${Math.floor(elapsed / 60000)} minutes ${Math.floor(elapsed / 1000) % 60} seconds`}
            >
              {String(Math.floor(elapsed / 60000)).padStart(2, "0")}:
              {String(Math.floor(elapsed / 1000) % 60).padStart(2, "0")}
            </div>
          </div>
          <p>
            Prescribed duration:{" "}
            {Math.round(session.consumer_snapshot.duration_seconds / 60)}{" "}
            minutes · State:{" "}
            <strong>{session.state.replaceAll("_", " ")}</strong>
          </p>
          {line && (
            <article className="fz-exercise" tabIndex={-1}>
              <p className="fz-eyebrow">
                {line.section} · item {line.line_index + 1} of{" "}
                {session.consumer_snapshot.lines.length}
              </p>
              <h3>{line.name}</h3>
              <p>{line.purpose}</p>
              <p>{line.setup_and_execution}</p>
              <pre aria-label="Prescribed dose">
                {JSON.stringify(line.dose, null, 2)}
              </pre>
              <p>
                Equipment:{" "}
                {line.equipment.length ? line.equipment.join(", ") : "None"}
              </p>
              {line.media.length === 0 && (
                <p className="fz-muted">
                  No approved image is available. All essential information
                  remains in text.
                </p>
              )}
            </article>
          )}
          <div className="fz-actions" aria-label="Session controls">
            {session.state === "NOT_STARTED" && (
              <button onClick={() => command("START")}>Start session</button>
            )}
            {session.state === "IN_PROGRESS" && (
              <button onClick={() => command("PAUSE")}>Pause</button>
            )}
            {session.state === "PAUSED" && (
              <button onClick={() => command("RESUME")}>Resume</button>
            )}
            {["IN_PROGRESS", "PAUSED"].includes(session.state) && (
              <>
                <button onClick={() => record("COMPLETED")}>
                  Record item complete
                </button>
                <button onClick={() => record("SKIPPED")}>
                  Skip and record
                </button>
                <button onClick={() => command("COMPLETE")}>
                  Complete workout
                </button>
                <button onClick={() => command("ABANDON")}>
                  Abandon workout
                </button>
              </>
            )}
          </div>
          <button onClick={synchronize}>Synchronize queued actions</button>
          <p className="fz-muted">
            Timers assist execution and do not change the prescription. New
            pain, restriction, or unsafe conditions require stopping and
            contacting the server safety path.
          </p>
        </section>
      )}
      <section className="fz-history">
        <h3>Personal history</h3>
        <button onClick={loadHistory} disabled={!account}>
          Load completed and abandoned sessions
        </button>
        {history.length === 0 ? (
          <p>No history loaded.</p>
        ) : (
          <ul>
            {history.map((item) => (
              <li key={String(item.id)}>
                {String(item.created_at)} · {String(item.objective)} ·{" "}
                {String(item.state)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
