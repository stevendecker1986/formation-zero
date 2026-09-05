"use client";
import { useState } from "react";
export default function RuleConsole({ canActivate }: { canActivate: boolean }) {
  const [set, setSet] = useState("");
  const [reason, setReason] = useState("");
  const [body, setBody] = useState(
    '{"mode":"TEST","rule_set_version":"","as_of":"2026-09-05","facts":{},"candidates":[]}',
  );
  const [output, setOutput] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  async function request(path: string, input?: unknown) {
    setBusy(true);
    try {
      const response = await fetch("/admin/api/knowledge/" + path, {
        method: input === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        body: input === undefined ? undefined : JSON.stringify(input),
        cache: "no-store",
      });
      const result = await response.json();
      setOutput(result);
    } catch {
      setOutput({ error: "Invalid request or unavailable service" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Rule engine administration">
      <h3>Rule engine</h3>
      <p>
        Manage RULE, REASON_CODE and RULE_SET versions in the collection editor.
        Test fixtures remain isolated. Evaluation returns constraints and
        explanations; it does not create a workout.
      </p>
      <label>
        Published production rule-set version ID
        <input value={set} onChange={(e) => setSet(e.target.value)} />
      </label>
      <label>
        Activation reason
        <input value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <button
        disabled={!canActivate || busy || !set || !reason}
        onClick={() =>
          void request("rule-activations", { rule_set_version: set, reason })
        }
      >
        Activate production rule set
      </button>
      <button disabled={busy} onClick={() => void request("rule-activations")}>
        View activation history
      </button>
      <p>
        Use synthetic facts for testing. Production mode loads the active set
        and candidate metadata on the server. Facts are not retained;
        access-controlled evaluation provenance is retained.
      </p>
      <label>
        Evaluation request JSON
        <textarea
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <button
        disabled={busy}
        onClick={() => {
          try {
            void request("rule-evaluations", JSON.parse(body));
          } catch {
            setOutput({ error: "Invalid JSON" });
          }
        }}
      >
        Evaluate constraints
      </button>
      {output !== null && (
        <pre aria-label="Rule engine result">
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </section>
  );
}
