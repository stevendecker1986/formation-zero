"use client";
import { useState } from "react";
export default function PrescriptionConsole() {
  const [body, setBody] = useState("");
  const [output, setOutput] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState("");
  async function request(path: string, input?: unknown) {
    setBusy(true);
    try {
      const response = await fetch("/admin/api/knowledge/" + path, {
        method: input === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        body: input === undefined ? undefined : JSON.stringify(input),
        cache: "no-store",
      });
      const data = await response.json();
      setOutput(data);
      if (response.ok && path === "prescription-fixtures")
        setBody(
          JSON.stringify(
            {
              mode: "TEST",
              catalog_version: data.catalog_version,
              context: data.default_context,
            },
            null,
            2,
          ),
        );
      if (response.ok && data.record_id) setRecord(data.record_id);
    } catch {
      setOutput({ error: "Invalid request or unavailable service" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Prescription engine testing">
      <h3>Individual prescription testing</h3>
      <p>
        Synthetic software fixtures only. Phase C controls eligibility and
        constraints. The result is a candidate session awaiting future
        independent validation.
      </p>
      <button
        disabled={busy}
        onClick={() => void request("prescription-fixtures")}
      >
        Load synthetic prescription catalog
      </button>
      <p>
        The catalog identifies the fixed synthetic rule set and candidate
        versions. Edit the request to supply objective, equipment, space, facts,
        preferences and candidate scope. Test data is never published.
        Restricted results include exclusions, dose decisions, session timing
        and exact provenance.
      </p>
      <label>
        Prescription request JSON
        <textarea
          rows={16}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <button
        disabled={busy || !body}
        onClick={() => {
          try {
            void request("prescriptions", JSON.parse(body));
          } catch {
            setOutput({ error: "Invalid JSON" });
          }
        }}
      >
        Construct synthetic candidate session
      </button>
      <label>
        Saved prescription record ID
        <input value={record} onChange={(e) => setRecord(e.target.value)} />
      </label>
      <button
        disabled={busy || !record}
        onClick={() =>
          void request("prescriptions/" + encodeURIComponent(record))
        }
      >
        Read saved prescription
      </button>
      {output !== null && (
        <pre aria-label="Prescription result">
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </section>
  );
}
