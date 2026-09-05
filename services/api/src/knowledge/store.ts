import type pg from "pg";
import { randomUUID } from "node:crypto";
import { transaction } from "../db.js";
import {
  type Kind,
  type Permission,
  type Payload,
  type ReviewType,
  parsePayload,
  requiredReviews,
  reviewSchema,
  transitionSchema,
  filterSchema,
} from "@formation-zero/knowledge";
export class KnowledgeError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
const deny = (code = "FORBIDDEN", status = 403): never => {
  throw new KnowledgeError(status, code);
};
type Client = pg.PoolClient;
export type Actor = { userId: string; requestId: string };
export type Version = {
  id: string;
  entity_id: string;
  code: string;
  kind: Kind;
  version: number;
  payload: Payload;
  created_by: string;
  status: string;
  revision: number;
  approved_by: string | null;
  title: string;
};
export async function access(c: Client, actor: Actor, permission?: Permission) {
  // Low-volume editorial transactions share a lock so publication cannot race
  // a rights change, review decision or grant revocation in another request.
  await c.query("SELECT pg_advisory_xact_lock(620260904)");
  const user = await c.query(
    "SELECT id FROM users WHERE id=$1 AND enabled FOR UPDATE",
    [actor.userId],
  );
  if (!user.rowCount) deny();
  const admin = Boolean(
    (
      await c.query(
        "SELECT 1 FROM user_roles WHERE user_id=$1 AND role='PLATFORM_ADMIN'",
        [actor.userId],
      )
    ).rowCount,
  );
  const permissions = (
    await c.query<{ permission: Permission }>(
      "SELECT permission FROM kb_grants WHERE user_id=$1",
      [actor.userId],
    )
  ).rows.map((r) => r.permission);
  if (
    permission
      ? !permissions.includes(permission)
      : !admin && !permissions.length
  )
    deny();
  return { admin, permissions };
}
export async function consumerAccess(c: Client, actor: Actor) {
  const user = await c.query(
    "SELECT id FROM users WHERE id=$1 AND enabled FOR UPDATE",
    [actor.userId],
  );
  if (!user.rowCount) deny();
}
export async function audit(
  c: Client,
  actor: Actor,
  action: string,
  id: string,
  metadata: Record<string, string | number | boolean> = {},
) {
  await c.query(
    "INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,reason,metadata,request_id) VALUES($1,$2,$3,'KNOWLEDGE',$4,'OPERATOR_AUTHORIZED_CHANGE',$5,$6)",
    [
      randomUUID(),
      actor.userId,
      "knowledge." + action,
      id,
      JSON.stringify(metadata),
      actor.requestId,
    ],
  );
}
export async function get(
  c: Client,
  id: string,
  lock = false,
): Promise<Version> {
  const row = (
    await c.query<Version>(
      "SELECT v.*,e.code,e.kind,s.status,s.revision,s.approved_by,s.published_at,s.superseded_by,s.retired_at,s.retirement_reason FROM kb_versions v JOIN kb_entities e ON e.id=v.entity_id JOIN kb_states s ON s.version_id=v.id WHERE v.id=$1" +
        (lock ? " FOR UPDATE OF s" : ""),
      [id],
    )
  ).rows[0];
  if (!row) deny("NOT_FOUND", 404);
  return row!;
}
async function latest(c: Client, entity: string) {
  return (
    await c.query<{ id: string }>(
      "SELECT id FROM kb_versions WHERE entity_id=$1 ORDER BY version DESC LIMIT 1",
      [entity],
    )
  ).rows[0]!.id;
}
const redact = (v: Version) => ({
  ...v,
  payload: Object.fromEntries(
    Object.entries(v.payload).filter(
      ([key]) => key !== "credential_identifier",
    ),
  ),
});
export async function read(pool: pg.Pool, actor: Actor, id: string) {
  return transaction(pool, async (c) => {
    await access(c, actor);
    const v = await get(c, id);
    return {
      ...redact(v),
      verification: await verification(c, v),
      referenced_by: (
        await c.query(
          "SELECT version_id,relation FROM kb_links WHERE target_id=$1 ORDER BY version_id,relation",
          [id],
        )
      ).rows,
      supersedes: (
        await c.query(
          "SELECT version_id FROM kb_states WHERE superseded_by=$1",
          [id],
        )
      ).rows,
      links: (
        await c.query(
          "SELECT relation,target_id FROM kb_links WHERE version_id=$1",
          [id],
        )
      ).rows,
      reviews: (
        await c.query(
          "SELECT * FROM kb_reviews WHERE version_id=$1 ORDER BY sequence",
          [id],
        )
      ).rows,
      history: (
        await c.query(
          "SELECT v.id,v.version,s.status,v.created_at FROM kb_versions v JOIN kb_states s ON s.version_id=v.id WHERE v.entity_id=$1 ORDER BY v.version DESC",
          [v.entity_id],
        )
      ).rows,
    };
  });
}
const prefixes: Record<Kind, string> = {
  RULE: "RULE",
  REASON_CODE: "RSN",
  RULE_SET: "RSET",
  PRESCRIPTION_TEMPLATE: "PTPL",
  SOURCE: "SRC",
  SOURCE_VERSION: "SRV",
  SOURCE_SECTION: "SEC",
  CITATION: "CIT",
  AUTHOR: "AUT",
  QUALIFICATION: "QLF",
  REVIEWER: "REV",
  EXERCISE: "EX",
  EQUIPMENT: "EQP",
  RECOVERY: "RCV",
  RESTRICTION: "RST",
  MEDIA_REQUIREMENT: "MRQ",
  MEDIA_ASSET: "AST",
  RIGHTS: "RGT",
};
function references(
  p: Payload,
  kind: Kind,
): { relation: string; id: string; kinds: Kind[] }[] {
  const result: { relation: string; id: string; kinds: Kind[] }[] = [];
  const single: Record<string, Kind[]> = {
    source: [kind === "RESTRICTION" ? "SOURCE_SECTION" : "SOURCE"],
    reason_code: ["REASON_CODE"],
    source_version: ["SOURCE_VERSION"],
    section: ["SOURCE_SECTION"],
    author: ["AUTHOR"],
    rights: ["RIGHTS"],
    person: ["AUTHOR"],
    reviewer: ["REVIEWER"],
    media_requirement: ["MEDIA_REQUIREMENT"],
    parent_exercise: ["EXERCISE"],
  };
  for (const [key, kinds] of Object.entries(single))
    if (typeof p[key] === "string")
      result.push({ relation: key, id: p[key], kinds });
  for (const [key, kinds] of Object.entries({
    rules: ["RULE"],
    citations: ["CITATION"],
    equipment: ["EQUIPMENT"],
    restrictions: ["RESTRICTION"],
    media_assets: ["MEDIA_ASSET"],
  } as Record<string, Kind[]>))
    for (const id of (p[key] ?? []) as string[])
      result.push({ relation: key, id, kinds });
  for (const r of (p.relationships ?? []) as {
    type?: string;
    target_type?: string;
    target: string;
  }[])
    if (r.type || r.target_type === "EXERCISE")
      result.push({
        relation: r.type ?? "recovery_exercise",
        id: r.target,
        kinds: r.type === "RECOVERY" ? ["RECOVERY"] : ["EXERCISE"],
      });
  return result;
}
export async function insert(
  c: Client,
  actor: Actor,
  kind: Kind,
  input: unknown,
  prior?: Version,
) {
  const payload = parsePayload(kind, input);
  if (
    prior &&
    ["RULE", "REASON_CODE", "RULE_SET", "PRESCRIPTION_TEMPLATE"].includes(
      kind,
    ) &&
    prior.payload.synthetic !== payload.synthetic
  )
    deny("SYNTHETIC_IDENTITY_IMMUTABLE", 409);
  // RIGHTS.source is a locator, not a content reference.
  const refs = references(
    kind === "RIGHTS" ? { ...payload, source: null } : payload,
    kind,
  );
  for (const ref of refs) {
    const target = await get(c, ref.id);
    if (
      !ref.kinds.includes(target.kind) ||
      ["RETIRED", "SUPERSEDED"].includes(target.status)
    )
      deny("INVALID_REFERENCE", 400);
  }
  if (kind === "REVIEWER" || kind === "AUTHOR") {
    const user = payload.user_id ?? payload.platform_user_id;
    if (
      user &&
      !(await c.query("SELECT 1 FROM users WHERE id=$1", [user])).rowCount
    )
      deny("INVALID_PERSON", 400);
  }
  let entity = prior?.entity_id;
  if (!entity) {
    entity = randomUUID();
    const n = (
      await c.query<{ n: string }>(
        "SELECT nextval('kb_code_sequence')::text AS n",
      )
    ).rows[0]!.n;
    await c.query("INSERT INTO kb_entities(id,code,kind) VALUES($1,$2,$3)", [
      entity,
      "FZ-" + prefixes[kind] + "-" + n.padStart(6, "0"),
      kind,
    ]);
  }
  const id = randomUUID();
  await c.query(
    "INSERT INTO kb_versions(id,entity_id,version,previous_version,title,payload,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [
      id,
      entity,
      (prior?.version ?? 0) + 1,
      prior?.id ?? null,
      payload.name,
      JSON.stringify(payload),
      actor.userId,
    ],
  );
  await c.query("INSERT INTO kb_states(version_id,status) VALUES($1,$2)", [
    id,
    kind === "SOURCE" ? "DISCOVERED" : "INGESTED",
  ]);
  for (const r of refs)
    await c.query(
      "INSERT INTO kb_links(version_id,relation,target_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
      [id, r.relation, r.id],
    );
  if (kind === "EXERCISE")
    for (const [category, primary, secondary] of [
      ["MOVEMENT", "primary_movement", "secondary_movements"],
      ["CAPABILITY", "primary_capability", "secondary_capabilities"],
    ]) {
      await c.query(
        "INSERT INTO kb_tags(version_id,category,name,is_primary) VALUES($1,$2,$3,true)",
        [id, category, payload[primary!]],
      );
      for (const name of payload[secondary!] as string[])
        await c.query(
          "INSERT INTO kb_tags(version_id,category,name,is_primary) VALUES($1,$2,$3,false)",
          [id, category, name],
        );
    }
  await audit(c, actor, kind.toLowerCase() + ".version_created", id, {
    version: (prior?.version ?? 0) + 1,
  });
  if (prior && kind === "RULE") {
    const before = prior.payload.definition as { priority: number };
    const after = payload.definition as { priority: number };
    if (before.priority !== after.priority)
      await audit(c, actor, "rule.priority_changed", id, {
        from: before.priority,
        to: after.priority,
      });
    if (prior.payload.reason_code !== payload.reason_code)
      await audit(c, actor, "rule.reason_reference_changed", id);
  }
  if (prior && kind === "REASON_CODE")
    await audit(c, actor, "reason_code.version_changed", id);
  return redact(await get(c, id));
}
export async function create(
  pool: pg.Pool,
  actor: Actor,
  kind: Kind,
  data: unknown,
) {
  return transaction(pool, async (c) => {
    await access(c, actor, "CONTENT_EDITOR");
    return insert(c, actor, kind, data);
  });
}
export async function newVersion(
  pool: pg.Pool,
  actor: Actor,
  id: string,
  expected: number,
  data: unknown,
) {
  return transaction(pool, async (c) => {
    await access(c, actor, "CONTENT_EDITOR");
    const old = await get(c, id);
    await c.query("SELECT id FROM kb_entities WHERE id=$1 FOR UPDATE", [
      old.entity_id,
    ]);
    if ((await latest(c, old.entity_id)) !== id || old.version !== expected)
      deny("VERSION_CONFLICT", 409);
    // Read responses omit this private field; an unrelated edit must preserve it.
    if (
      old.kind === "QUALIFICATION" &&
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      !("credential_identifier" in data)
    )
      data = {
        ...data,
        credential_identifier: old.payload.credential_identifier,
      };
    return insert(c, actor, old.kind, data, old);
  });
}
export async function grant(
  pool: pg.Pool,
  actor: Actor,
  user: string,
  permission: Permission,
  enabled: boolean,
) {
  return transaction(pool, async (c) => {
    if (!(await access(c, actor)).admin) deny();
    if (
      !(await c.query("SELECT 1 FROM users WHERE id=$1 AND enabled", [user]))
        .rowCount
    )
      deny("INVALID_ACCOUNT", 400);
    if (enabled)
      await c.query(
        "INSERT INTO kb_grants(user_id,permission,granted_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
        [user, permission, actor.userId],
      );
    else
      await c.query(
        "DELETE FROM kb_grants WHERE user_id=$1 AND permission=$2",
        [user, permission],
      );
    await audit(
      c,
      actor,
      enabled ? "permission.granted" : "permission.revoked",
      user,
      { permission },
    );
    return { ok: true };
  });
}
export async function review(
  pool: pg.Pool,
  actor: Actor,
  id: string,
  input: unknown,
) {
  const body = reviewSchema.parse(input);
  return transaction(pool, async (c) => {
    await access(c, actor, (body.type + "_REVIEWER") as Permission);
    const v = await get(c, id, true);
    if (["APPROVED", "PUBLISHED", "SUPERSEDED", "RETIRED"].includes(v.status))
      deny("VERSION_FROZEN", 409);
    const reviewer = await get(c, body.reviewer);
    if (
      reviewer.kind !== "REVIEWER" ||
      reviewer.payload.user_id !== actor.userId ||
      reviewer.payload.active !== true ||
      (await latest(c, reviewer.entity_id)) !== reviewer.id ||
      !(reviewer.payload.review_types as string[]).includes(body.type)
    )
      deny("INVALID_REVIEWER");
    if (
      body.type === "SPECIALTY" &&
      (!body.specialty ||
        !(reviewer.payload.specialties as string[]).includes(body.specialty))
    )
      deny("INVALID_SPECIALTY", 400);
    if (body.type !== "SPECIALTY" && body.specialty)
      deny("INVALID_SPECIALTY", 400);
    await c.query(
      "INSERT INTO kb_reviews(id,version_id,reviewer_id,reviewer_user_id,review_type,decision,comments,re_review_date,specialty) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [
        randomUUID(),
        id,
        reviewer.id,
        actor.userId,
        body.type,
        body.decision,
        body.comments,
        body.re_review_date,
        body.specialty,
      ],
    );
    const states: Partial<Record<ReviewType, string>> = {
      TECHNICAL: "TECHNICALLY_REVIEWED",
      SAFETY: "SAFETY_REVIEWED",
      EDITORIAL:
        v.kind === "SOURCE_VERSION"
          ? "SOURCE_VERIFIED"
          : "EDITORIALLY_REVIEWED",
    };
    await c.query(
      "UPDATE kb_states SET revision=revision+1,status=$2,approved_by=NULL WHERE version_id=$1",
      [
        id,
        body.decision === "APPROVE"
          ? (states[body.type] ?? v.status)
          : "INGESTED",
      ],
    );
    await audit(c, actor, "review." + body.decision.toLowerCase(), id, {
      type: body.type,
      reviewer: reviewer.id,
    });
    return { ok: true };
  });
}
async function validReview(c: Client, id: string, type: ReviewType) {
  const row = (
    await c.query<{
      decision: string;
      reviewer_user_id: string;
      reviewer_id: string;
      valid: boolean;
    }>(
      "SELECT *, (re_review_date IS NULL OR re_review_date>current_date) AS valid FROM kb_reviews WHERE version_id=$1 AND review_type=$2 ORDER BY sequence DESC LIMIT 1",
      [id, type],
    )
  ).rows[0];
  if (!row || row.decision !== "APPROVE" || !row.valid) return false;
  const reviewer = await get(c, row.reviewer_id);
  const current = await get(c, await latest(c, reviewer.entity_id));
  return (
    current.payload.active === true &&
    current.payload.user_id === row.reviewer_user_id &&
    !["RETIRED", "SUPERSEDED"].includes(current.status) &&
    (current.payload.review_types as string[]).includes(type) &&
    Boolean(
      (
        await c.query(
          "SELECT 1 FROM kb_grants g JOIN users u ON u.id=g.user_id WHERE g.user_id=$1 AND g.permission=$2 AND u.enabled",
          [row.reviewer_user_id, type + "_REVIEWER"],
        )
      ).rowCount,
    )
  );
}
async function verification(c: Client, v: Version) {
  const types: Partial<Record<Kind, ReviewType>> = {
    SOURCE_VERSION: "EDITORIAL",
    CITATION: "EDITORIAL",
    QUALIFICATION: "TECHNICAL",
    RIGHTS: "RIGHTS",
  };
  const type = types[v.kind];
  if (!type) return null;
  const decision = (
    await c.query(
      "SELECT reviewer_id,reviewed_at,decision,re_review_date FROM kb_reviews WHERE version_id=$1 AND review_type=$2 ORDER BY sequence DESC LIMIT 1",
      [v.id, type],
    )
  ).rows[0];
  return {
    type,
    status: (await validReview(c, v.id, type)) ? "VERIFIED" : "UNVERIFIED",
    verified_by: decision?.reviewer_id ?? null,
    verified_at: decision?.reviewed_at ?? null,
    latest_decision: decision?.decision ?? null,
    re_review_date: decision?.re_review_date ?? null,
  };
}
export async function eligibility(
  c: Client,
  v: Version,
  actor: Actor,
  approving = false,
) {
  const reasons: string[] = [];
  if (
    approving
      ? [
          "DISCOVERED",
          "APPROVED",
          "PUBLISHED",
          "SUPERSEDED",
          "RETIRED",
        ].includes(v.status)
      : v.status !== "APPROVED"
  )
    reasons.push("STATUS_NOT_ELIGIBLE");
  if (v.created_by === actor.userId) reasons.push("FOUR_EYES_REQUIRED");
  for (const type of requiredReviews(v.kind, v.payload.provenance))
    if (!(await validReview(c, v.id, type)))
      reasons.push("REVIEW_REQUIRED:" + type);
  if (v.payload.author) {
    const author = await get(c, String(v.payload.author));
    if (author.payload.active !== true) reasons.push("AUTHOR_INACTIVE");
    if (author.payload.platform_user_id === actor.userId)
      reasons.push("FOUR_EYES_REQUIRED");
  }
  if (v.payload.rights || v.kind === "RIGHTS") {
    const rights =
      v.kind === "RIGHTS" ? v : await get(c, String(v.payload.rights));
    await c.query("SELECT id FROM kb_entities WHERE id=$1 FOR SHARE", [
      rights.entity_id,
    ]);
    const current = await get(c, await latest(c, rights.entity_id));
    if (
      ["UNKNOWN", "THIRD_PARTY_COPYRIGHT"].includes(
        String(rights.payload.classification),
      ) ||
      rights.payload.commercial_use_allowed !== true ||
      current.id !== rights.id ||
      ["RETIRED", "SUPERSEDED"].includes(rights.status)
    )
      reasons.push("RIGHTS_NOT_ELIGIBLE");
    if (!(await validReview(c, rights.id, "RIGHTS")))
      reasons.push("RIGHTS_VERIFICATION_REQUIRED");
    if (
      ["LICENSED", "PERMISSION_GRANTED"].includes(
        String(rights.payload.classification),
      ) &&
      !rights.payload.permission_reference
    )
      reasons.push("PERMISSION_EVIDENCE_REQUIRED");
  }
  const ancestry = (
    await c.query<{ id: string; kind: Kind }>(
      "WITH RECURSIVE refs(id) AS (SELECT target_id FROM kb_links WHERE version_id=$1 UNION SELECT l.target_id FROM kb_links l JOIN refs r ON l.version_id=r.id) SELECT v.id,e.kind FROM refs r JOIN kb_versions v ON v.id=r.id JOIN kb_entities e ON e.id=v.entity_id",
      [v.id],
    )
  ).rows;
  const sources = ancestry.filter((r) => r.kind === "SOURCE_VERSION");
  if (
    [
      "OFFICIAL",
      "OFFICIAL_DERIVED",
      "FZ_DERIVED",
      "SUPPORTING_EVIDENCE",
    ].includes(String(v.payload.provenance)) &&
    !sources.length
  )
    reasons.push("SOURCE_REQUIRED");
  for (const source of sources)
    if (!(await validReview(c, source.id, "EDITORIAL")))
      reasons.push("SOURCE_VERIFICATION_REQUIRED");
  for (const link of ancestry.filter((r) => r.kind === "RESTRICTION"))
    if (!(await validReview(c, link.id, "SAFETY")))
      reasons.push("RESTRICTION_SAFETY_REVIEW_REQUIRED");
  if (v.kind === "EXERCISE") {
    const req = (await get(c, String(v.payload.media_requirement))).payload;
    const assets: Version[] = [];
    for (const id of v.payload.media_assets as string[])
      assets.push(await get(c, id));
    const stills = assets.filter((a) =>
      ["IMAGE", "ILLUSTRATION", "DIAGRAM"].includes(
        String(a.payload.asset_type),
      ),
    );
    if (
      stills.length < Number(req.minimum_images) ||
      stills.length > Number(req.maximum_images)
    )
      reasons.push("STILL_COUNT_INVALID");
    for (const view of req.required_views as string[])
      if (!stills.some((a) => a.payload.view === view))
        reasons.push("VIEW_REQUIRED:" + view);
    for (const asset of assets)
      if (asset.status !== "PUBLISHED") reasons.push("MEDIA_NOT_PUBLISHED");
  }
  if (v.kind === "RULE_SET")
    for (const ref of v.payload.rules as string[]) {
      const rule = await get(c, ref);
      if (
        rule.payload.synthetic !== v.payload.synthetic ||
        !(await publishedEligibility(c, rule))
      )
        reasons.push("RULE_NOT_PRODUCTION_ELIGIBLE");
    }
  if (v.kind === "RULE") {
    const reason = await get(c, String(v.payload.reason_code));
    if (
      reason.payload.synthetic !== v.payload.synthetic ||
      !(await publishedEligibility(c, reason))
    )
      reasons.push("REASON_NOT_PUBLISHED");
  }
  return { eligible: reasons.length === 0, reasons: [...new Set(reasons)] };
}
export async function check(pool: pg.Pool, actor: Actor, id: string) {
  return transaction(pool, async (c) => {
    await access(c, actor);
    return eligibility(c, await get(c, id), actor);
  });
}
export async function transition(
  pool: pg.Pool,
  actor: Actor,
  id: string,
  input: unknown,
) {
  const body = transitionSchema.parse(input);
  return transaction(pool, async (c) => {
    await access(
      c,
      actor,
      body.action === "SUBMIT" ? "CONTENT_EDITOR" : "PUBLISHER",
    );
    const v = await get(c, id, true);
    if (v.revision !== body.expected_revision) deny("REVISION_CONFLICT", 409);
    if (["SUPERSEDED", "RETIRED"].includes(v.status))
      deny("TERMINAL_VERSION", 409);
    if (body.action === "SUBMIT") {
      if (["PUBLISHED", "APPROVED"].includes(v.status))
        deny("VERSION_FROZEN", 409);
      await c.query(
        "UPDATE kb_states SET status='INGESTED',revision=revision+1 WHERE version_id=$1",
        [id],
      );
    } else if (body.action === "APPROVE" || body.action === "PUBLISH") {
      const result = await eligibility(c, v, actor, body.action === "APPROVE");
      if (!result.eligible)
        throw new KnowledgeError(409, result.reasons.join(","));
      if (body.action === "PUBLISH" && v.approved_by !== actor.userId)
        deny("APPROVER_REQUIRED");
      await c.query(
        "UPDATE kb_states SET status=$2,approved_by=$3,published_at=CASE WHEN $2='PUBLISHED' THEN now() ELSE published_at END,revision=revision+1 WHERE version_id=$1",
        [
          id,
          body.action === "APPROVE" ? "APPROVED" : "PUBLISHED",
          actor.userId,
        ],
      );
    } else if (body.action === "RETIRE") {
      await c.query(
        "UPDATE kb_states SET status='RETIRED',retired_at=now(),retirement_reason=$2,revision=revision+1 WHERE version_id=$1",
        [id, body.reason],
      );
    } else {
      if (v.status !== "PUBLISHED" || !body.target)
        deny("INVALID_SUPERSESSION", 409);
      const target = await get(c, body.target!, true);
      if (
        target.entity_id !== v.entity_id ||
        target.version <= v.version ||
        target.status !== "PUBLISHED"
      )
        deny("INVALID_SUPERSESSION", 409);
      // Link the successor at publication time via a separate lineage table entry.
      await c.query(
        "UPDATE kb_states SET status='SUPERSEDED',superseded_by=$2,revision=revision+1 WHERE version_id=$1",
        [id, target.id],
      );
    }
    await audit(c, actor, "lifecycle." + body.action.toLowerCase(), id, {
      from: v.status,
      target: body.target ?? "",
      reason: body.reason,
    });
    return redact(await get(c, id));
  });
}
export async function list(pool: pg.Pool, actor: Actor, input: unknown) {
  const f = filterSchema.parse(input);
  return transaction(pool, async (c) => {
    await access(c, actor);
    const rows = (
      await c.query<Version>(
        `SELECT v.*,e.code,e.kind,s.status,s.revision,s.approved_by FROM kb_versions v JOIN kb_entities e ON e.id=v.entity_id JOIN kb_states s ON s.version_id=v.id LEFT JOIN kb_versions rights ON rights.id::text=v.payload->>'rights'
 WHERE ($1::text IS NULL OR e.kind=$1) AND ($2::text IS NULL OR v.title ILIKE '%'||$2||'%' OR e.code ILIKE '%'||$2||'%') AND ($3::text IS NULL OR s.status=$3) AND ($4::text IS NULL OR v.payload->>'provenance'=$4) AND ($5::text IS NULL OR coalesce(rights.payload->>'classification',v.payload->>'classification')=$5)
 AND ($6::text IS NULL OR ($6='PENDING' AND s.status NOT IN ('APPROVED','PUBLISHED','SUPERSEDED','RETIRED')) OR EXISTS(SELECT 1 FROM kb_reviews r WHERE r.version_id=v.id AND r.decision=$6 AND NOT EXISTS(SELECT 1 FROM kb_reviews newer WHERE newer.version_id=r.version_id AND newer.review_type=r.review_type AND newer.sequence>r.sequence)))
 AND ($8::text IS NULL OR EXISTS(SELECT 1 FROM kb_corpus_members cm WHERE cm.entity_id=e.id AND cm.corpus=$8))
 ORDER BY v.created_at DESC,v.id LIMIT 50 OFFSET $7`,
        [
          f.kind ?? null,
          f.q ?? null,
          f.status ?? null,
          f.provenance ?? null,
          f.rights ?? null,
          f.review ?? null,
          f.offset,
          f.corpus ?? null,
        ],
      )
    ).rows;
    return rows.map(redact);
  });
}

// Revalidate current review/rights/source/media prerequisites without publishing.
export async function publishedEligibility(
  c: Client,
  v: Version,
): Promise<boolean> {
  if (v.status !== "PUBLISHED" || !v.approved_by) return false;
  const stale = await c.query(
    "WITH RECURSIVE refs(id) AS (SELECT target_id FROM kb_links WHERE version_id=$1 UNION SELECT l.target_id FROM kb_links l JOIN refs r ON l.version_id=r.id) SELECT 1 FROM refs r JOIN kb_states s ON s.version_id=r.id WHERE s.status IN ('SUPERSEDED','RETIRED') LIMIT 1",
    [v.id],
  );
  if (stale.rowCount) return false;
  if (v.kind === "EXERCISE")
    for (const id of v.payload.media_assets as string[]) {
      if (!(await publishedEligibility(c, await get(c, id)))) return false;
    }
  const actor = { userId: v.approved_by, requestId: "production-boundary" };
  return (await eligibility(c, { ...v, status: "APPROVED" }, actor)).eligible;
}
