"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  KINDS,
  REVIEWS,
  SPECIALTIES,
  PERMISSIONS,
  schemas,
  type Kind,
  type Permission,
} from "@formation-zero/knowledge";
import { template } from "@formation-zero/knowledge/templates";
import { CONTENT_STATUSES, PROVENANCE, RIGHTS } from "@formation-zero/domain";
type RecordView = {
  id: string;
  code: string;
  kind: Kind;
  version: number;
  revision: number;
  status: string;
  title: string;
  payload: Record<string, unknown>;
  history?: { id: string; version: number; status: string }[];
  reviews?: unknown[];
  links?: unknown[];
  verification?: unknown;
  referenced_by?: unknown[];
  supersedes?: unknown[];
  superseded_by?: string | null;
  published_at?: string | null;
  retired_at?: string | null;
  retirement_reason?: string | null;
};
const root = "/admin/api/knowledge/";
async function request(path: string, body?: unknown) {
  const response = await fetch(root + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.code ?? "Request failed");
  return data;
}
function Fields({
  data,
  onChange,
}: {
  data: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        const label = key.replaceAll("_", " ");
        const update = (v: unknown) => onChange({ ...data, [key]: v });
        const nullableNumber = [
          "page_start",
          "page_end",
          "width",
          "height",
          "duration_seconds",
        ].includes(key);
        const nullable =
          nullableNumber ||
          key.endsWith("_date") ||
          ["platform_user_id", "parent_exercise", "variant", "view"].includes(
            key,
          );
        if (
          value !== null &&
          typeof value === "object" &&
          !Array.isArray(value)
        )
          return (
            <fieldset key={key}>
              <legend>{label}</legend>
              <Fields
                data={value as Record<string, unknown>}
                onChange={update}
              />
            </fieldset>
          );
        if (typeof value === "boolean")
          return (
            <label key={key}>
              {label}
              <select
                value={String(value)}
                onChange={(e) => update(e.target.value === "true")}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
          );
        if (Array.isArray(value))
          return (
            <ArrayField
              key={key}
              label={label}
              value={value}
              onChange={update}
            />
          );
        return (
          <label key={key}>
            {label}
            {value === null ? " (optional)" : ""}
            <input
              type={
                typeof value === "number" || nullableNumber
                  ? "number"
                  : key.endsWith("_date")
                    ? "date"
                    : key === "credential_identifier"
                      ? "password"
                      : "text"
              }
              value={value === null ? "" : String(value)}
              onChange={(e) =>
                update(
                  e.target.value === "" && nullable
                    ? null
                    : typeof value === "number" || nullableNumber
                      ? Number(e.target.value)
                      : e.target.value === "" && value === null
                        ? null
                        : e.target.value,
                )
              }
              autoComplete="off"
            />
          </label>
        );
      })}
    </>
  );
}
function ArrayField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown[];
  onChange: (v: unknown[]) => void;
}) {
  const [raw, setRaw] = useState(JSON.stringify(value));
  const [error, setError] = useState("");
  useEffect(() => setRaw(JSON.stringify(value)), [value]);
  return (
    <label>
      {label} (JSON array; references use exact version IDs)
      <textarea
        rows={3}
        value={raw}
        aria-invalid={Boolean(error)}
        onChange={(e) => {
          setRaw(e.target.value);
          try {
            const v: unknown = JSON.parse(e.target.value);
            if (!Array.isArray(v)) throw Error();
            onChange(v);
            setError("");
          } catch {
            setError("Enter a valid JSON array before saving.");
          }
        }}
      />
      {error && <span role="alert">{error}</span>}
    </label>
  );
}
export default function KnowledgeCMS() {
  const [kind, setKind] = useState<Kind>("SOURCE");
  const [rows, setRows] = useState<RecordView[]>([]);
  const [selected, setSelected] = useState<RecordView | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>(
    template("SOURCE"),
  );
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [admin, setAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [provenance, setProvenance] = useState("");
  const [rights, setRights] = useState("");
  const [reviewFilter, setReviewFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [specialty, setSpecialty] = useState("OTHER");
  const [reReview, setReReview] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [reviewType, setReviewType] = useState("TECHNICAL");
  const [decision, setDecision] = useState("APPROVE");
  const [comments, setComments] = useState("");
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState("");
  const [lookup, setLookup] = useState<unknown>(null);
  const [grantUser, setGrantUser] = useState("");
  const [permission, setPermission] = useState<Permission>("CONTENT_EDITOR");
  async function refresh() {
    const params = new URLSearchParams({ kind, offset: String(offset) });
    for (const [k, v] of Object.entries({
      q,
      status,
      provenance,
      rights,
      review: reviewFilter,
    }))
      if (v) params.set(k, v);
    setRows(await request("records?" + params));
  }
  async function work(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("Working…");
    try {
      await fn();
      setMessage("Request completed.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    request("access")
      .then((v) => {
        setPermissions(v.permissions);
        setAdmin(v.admin);
      })
      .catch(() => setMessage("Access denied"));
  }, []);
  useEffect(() => {
    let live = true;
    const params = new URLSearchParams({ kind, offset: String(offset) });
    for (const [key, value] of Object.entries({
      q,
      status,
      provenance,
      rights,
      review: reviewFilter,
    }))
      if (value) params.set(key, value);
    request("records?" + params)
      .then((v) => {
        if (live) setRows(v);
      })
      .catch(() => {
        if (live) setMessage("Unable to load records");
      });
    return () => {
      live = false;
    };
  }, [kind, offset, q, status, provenance, rights, reviewFilter]);
  async function select(id: string) {
    const v: RecordView = await request("versions/" + id);
    setSelected(v);
    setDraft(v.payload);
    setLookup(null);
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    const invalid = e.currentTarget.querySelector('[aria-invalid="true"]');
    await work(async () => {
      if (invalid)
        throw new Error("Correct invalid JSON fields before saving.");
      const checked = schemas[kind].safeParse(draft);
      if (!checked.success)
        throw new Error(
          checked.error.issues
            .map((i) => i.path.join(".") + ": " + i.message)
            .join("; "),
        );
      const v: RecordView = await request(
        selected ? "versions/" + selected.id + "/versions" : "records",
        selected
          ? {
              expected_version: selected.version,
              data:
                kind === "QUALIFICATION" && !("credential_identifier" in draft)
                  ? draft
                  : checked.data,
            }
          : { kind, data: checked.data },
      );
      await refresh();
      await select(v.id);
    });
  }
  async function transition(action: string) {
    await work(async () => {
      if (!selected) return;
      await request("versions/" + selected.id + "/transitions", {
        action,
        expected_revision: selected.revision,
        target: target || null,
        reason,
      });
      await select(selected.id);
      await refresh();
    });
  }
  return (
    <section className="fz-surface">
      <h2>Knowledge workspace</h2>
      <p>
        Versioned editorial metadata. Phase B uses synthetic fixtures only.
        Publishing here does not authorize commercial launch.
      </p>
      <div className="fz-actions">
        <label>
          Collection
          <select
            value={kind}
            onChange={(e) => {
              const k = e.target.value as Kind;
              setKind(k);
              setSelected(null);
              setDraft(template(k));
              setOffset(0);
            }}
          >
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <button
          onClick={() => {
            setReviewFilter("PENDING");
            setStatus("");
            setMessage("Review queue selected. Apply filters to load.");
          }}
        >
          Review / publication queue
        </button>
      </div>
      <form
        className="fz-form"
        onSubmit={(e) => {
          e.preventDefault();
          void work(refresh);
        }}
      >
        <label>
          Search name or FZ code
          <input value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {[
          ["Status", status, setStatus, CONTENT_STATUSES],
          ["Provenance", provenance, setProvenance, PROVENANCE],
          ["Rights", rights, setRights, RIGHTS],
          [
            "Review decision",
            reviewFilter,
            setReviewFilter,
            ["PENDING", "APPROVE", "REJECT", "CHANGES_REQUIRED"],
          ],
        ].map(([label, value, setter, choices]) => (
          <label key={String(label)}>
            {String(label)}
            <select
              value={String(value)}
              onChange={(e) => (setter as (s: string) => void)(e.target.value)}
            >
              <option value="">All</option>
              {(choices as readonly string[]).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        ))}
        <button disabled={busy}>Apply filters</button>
      </form>
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <button onClick={() => void work(() => select(row.id))}>
              {row.code} · v{row.version} · {row.title} · {row.status}
            </button>
          </li>
        ))}
      </ul>
      <div className="fz-actions">
        <button
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - 50))}
        >
          Previous
        </button>
        <button
          disabled={rows.length < 50}
          onClick={() => setOffset(offset + 50)}
        >
          Next
        </button>
      </div>
      <p role="status">{message}</p>
      {permissions.includes("CONTENT_EDITOR") && (
        <>
          <h3>{selected ? "Create next version" : "Create record"}</h3>
          <button
            onClick={() => {
              setSelected(null);
              setDraft(template(kind));
            }}
          >
            New synthetic record
          </button>
          <p>
            Every save creates an immutable version. Use version IDs from linked
            records; invalid fields are rejected by the server.
          </p>
          <form className="fz-form" onSubmit={save}>
            <Fields
              key={selected?.id ?? kind}
              data={draft}
              onChange={setDraft}
            />
            <button type="submit" disabled={busy}>
              Save new version
            </button>
          </form>
        </>
      )}
      {selected && (
        <>
          <h3>
            {selected.code} · version {selected.version}
          </h3>
          <p>
            Version ID: <code>{selected.id}</code>
          </p>
          <p>
            Status: {selected.status} · revision {selected.revision}
          </p>
          <details>
            <summary>Stored metadata and links</summary>
            <pre>
              {JSON.stringify(
                {
                  data: selected.payload,
                  links: selected.links,
                  referenced_by: selected.referenced_by,
                  verification: selected.verification,
                  published_at: selected.published_at,
                  supersedes: selected.supersedes,
                  superseded_by: selected.superseded_by,
                  retired_at: selected.retired_at,
                  retirement_reason: selected.retirement_reason,
                },
                null,
                2,
              )}
            </pre>
          </details>
          <h3>History</h3>
          <ul>
            {selected.history?.map((v) => (
              <li key={v.id}>
                <button onClick={() => void work(() => select(v.id))}>
                  Version {v.version} — {v.status}
                </button>
              </li>
            ))}
          </ul>
          <details>
            <summary>Append-only review history</summary>
            <pre>{JSON.stringify(selected.reviews, null, 2)}</pre>
          </details>
          <div className="fz-actions">
            {["eligibility", "provenance", "rights"].map((path) => (
              <button
                key={path}
                onClick={() =>
                  void work(async () =>
                    setLookup(
                      await request("versions/" + selected.id + "/" + path),
                    ),
                  )
                }
              >
                {path}
              </button>
            ))}
          </div>
          <h3>Submit review</h3>
          <form
            className="fz-form"
            onSubmit={(e) => {
              e.preventDefault();
              void work(async () => {
                await request("versions/" + selected.id + "/reviews", {
                  reviewer,
                  type: reviewType,
                  decision,
                  comments,
                  re_review_date: reReview || null,
                  specialty: reviewType === "SPECIALTY" ? specialty : null,
                });
                await select(selected.id);
              });
            }}
          >
            <label>
              Reviewer record version ID
              <input
                required
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
              />
            </label>
            <label>
              Review type
              <select
                value={reviewType}
                onChange={(e) => setReviewType(e.target.value)}
              >
                {REVIEWS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Decision
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              >
                {["APPROVE", "REJECT", "CHANGES_REQUIRED"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Re-review date (optional)
              <input
                type="date"
                value={reReview}
                onChange={(e) => setReReview(e.target.value)}
              />
            </label>
            {reviewType === "SPECIALTY" && (
              <label>
                Specialty
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                >
                  {SPECIALTIES.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Review comments
              <textarea
                required
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </label>
            <button disabled={busy}>Record review</button>
          </form>
          <h3>Lifecycle</h3>
          <label>
            Reason
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <label>
            Successor version ID (supersede only)
            <input value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>
          <div className="fz-actions">
            {["SUBMIT", "APPROVE", "PUBLISH", "SUPERSEDE", "RETIRE"].map(
              (action) => (
                <button
                  key={action}
                  disabled={
                    busy ||
                    !reason ||
                    !permissions.includes(
                      action === "SUBMIT" ? "CONTENT_EDITOR" : "PUBLISHER",
                    )
                  }
                  onClick={() => void transition(action)}
                >
                  {action}
                </button>
              ),
            )}
          </div>
        </>
      )}
      {admin && (
        <>
          <h3>Editorial permission management</h3>
          <p>
            Grants are separate from consumer roles, subscriptions and
            professional qualifications.
          </p>
          <label>
            Account ID
            <input
              value={grantUser}
              onChange={(e) => setGrantUser(e.target.value)}
            />
          </label>
          <label>
            Permission
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as Permission)}
            >
              {PERMISSIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <div className="fz-actions">
            {[true, false].map((enabled) => (
              <button
                key={String(enabled)}
                disabled={busy || !grantUser}
                onClick={() =>
                  void work(async () => {
                    await request("grants", {
                      user_id: grantUser,
                      permission,
                      enabled,
                    });
                  })
                }
              >
                {enabled ? "Grant" : "Revoke"}
              </button>
            ))}
            <button
              onClick={() =>
                void work(async () => setLookup(await request("grants")))
              }
            >
              View grants
            </button>
          </div>
        </>
      )}
      {lookup !== null && (
        <pre aria-label="Lookup result">{JSON.stringify(lookup, null, 2)}</pre>
      )}
    </section>
  );
}
