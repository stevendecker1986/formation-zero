import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { testHarness } from "./helpers.js";
import { template } from "@formation-zero/knowledge/templates";
import {
  PERMISSIONS,
  REVIEWS,
  MOVEMENTS,
  CAPABILITIES,
  parsePayload,
  type Kind,
} from "@formation-zero/knowledge";
type V = {
  id: string;
  entity_id: string;
  version: number;
  revision: number;
  status: string;
  payload: Record<string, unknown>;
};
test("knowledge real API, editorial workflow, constraints and privacy", async (t) => {
  const h = await testHarness();
  t.after(h.close);
  const password = "Synthetic-Knowledge-Password-91!";
  const editor = await h.register("editor@example.invalid", password);
  const publisher = await h.register("publisher@example.invalid", password);
  const ordinary = await h.register("ordinary@example.invalid", password);
  await h.pool.query(
    "INSERT INTO user_roles(user_id,role) VALUES($1,'PLATFORM_ADMIN')",
    [publisher],
  );
  const ec = (await h.login("editor@example.invalid", password)).cookie;
  const pc = (await h.login("publisher@example.invalid", password)).cookie;
  const uc = (await h.login("ordinary@example.invalid", password)).cookie;
  async function call(
    path: string,
    body?: unknown,
    cookie = ec,
    expected = 200,
  ) {
    const r = await h.request("/api/v1/knowledge/" + path, body, cookie);
    assert.equal(r.status, expected, await r.clone().text());
    return r.json();
  }
  const create = async (kind: Kind, data: Record<string, unknown> = {}) =>
    (await call(
      "records",
      { kind, data: { ...template(kind), ...data } },
      ec,
      201,
    )) as V;
  const read = async (v: V) => (await call("versions/" + v.id)) as V;
  const grant = async (permission: string, user = editor, enabled = true) =>
    call("grants", { user_id: user, permission, enabled }, pc);
  let author: V,
    reviewer: V,
    rights: V,
    source: V,
    sourceVersion: V,
    section: V,
    citation: V,
    media: V,
    exercise: V,
    recovery: V;
  const review = async (v: V, type: string, decision = "APPROVE") =>
    call("versions/" + v.id + "/reviews", {
      reviewer: reviewer.id,
      type,
      decision,
      comments: "Synthetic professional review decision only.",
    });
  const transition = async (
    v: V,
    action: string,
    cookie = pc,
    target: string | null = null,
    expected = 200,
  ) => {
    const current = await read(v);
    return (await call(
      "versions/" + v.id + "/transitions",
      {
        action,
        expected_revision: current.revision,
        target,
        reason: "Synthetic workflow validation",
      },
      cookie,
      expected,
    )) as V;
  };
  const publish = async (v: V) => {
    await transition(v, "APPROVE");
    return transition(v, "PUBLISH");
  };
  await t.test(
    "USER denied, admin has no implicit editor/reviewer/publisher authority, grants audited",
    async () => {
      await call("records", undefined, uc, 403);
      await call("records", undefined, "", 401);
      await call(
        "records",
        { kind: "AUTHOR", data: template("AUTHOR") },
        pc,
        403,
      );
      await call(
        "grants",
        { user_id: ordinary, permission: "PUBLISHER", enabled: true },
        ec,
        403,
      );
      await grant("CONTENT_EDITOR");
      for (const type of REVIEWS) await grant(type + "_REVIEWER");
      await grant("PUBLISHER", publisher);
      assert.ok(
        (
          await h.pool.query(
            "SELECT 1 FROM audit_events WHERE action='knowledge.permission.granted'",
          )
        ).rowCount,
      );
    },
  );
  await t.test(
    "author and qualifications are separate; credential IDs redacted by default",
    async () => {
      author = await create("AUTHOR", {
        name: "Synthetic API author",
        platform_user_id: editor,
      });
      reviewer = await create("REVIEWER", {
        person: author.id,
        user_id: editor,
        review_types: [...REVIEWS],
        specialties: ["OTHER"],
      });
      const qualification = await create("QUALIFICATION", {
        person: author.id,
        credential_identifier: "synthetic-private-credential",
      });
      assert.equal(qualification.payload.credential_identifier, undefined);
      assert.ok(
        !JSON.stringify(await call("records?kind=QUALIFICATION")).includes(
          "synthetic-private-credential",
        ),
      );
      assert.equal(
        (
          await h.pool.query(
            "SELECT payload->>'credential_identifier' AS credential FROM kb_versions WHERE id=$1",
            [qualification.id],
          )
        ).rows[0].credential,
        "synthetic-private-credential",
      );
      await review(qualification, "TECHNICAL");
      assert.equal(
        (await call("versions/" + qualification.id)).verification.status,
        "VERIFIED",
      );
      const revised = await call(
        "versions/" + qualification.id + "/versions",
        {
          expected_version: 1,
          data: {
            ...qualification.payload,
            notes: "Synthetic metadata revision",
          },
        },
        ec,
        201,
      );
      assert.equal(
        (
          await h.pool.query(
            "SELECT payload->>'credential_identifier' AS value FROM kb_versions WHERE id=$1",
            [revised.id],
          )
        ).rows[0].value,
        "synthetic-private-credential",
      );
      assert.equal(
        (await call("versions/" + revised.id)).verification.status,
        "UNVERIFIED",
      );
    },
  );
  await t.test(
    "sources, immutable source versions, sections/citations and provenance lookup",
    async () => {
      source = await create("SOURCE", { name: "Synthetic API source" });
      sourceVersion = await create("SOURCE_VERSION", { source: source.id });
      const v2 = await call(
        "versions/" + sourceVersion.id + "/versions",
        {
          expected_version: 1,
          data: {
            ...sourceVersion.payload,
            version_identifier: "synthetic-v2",
          },
        },
        ec,
        201,
      );
      assert.equal(v2.version, 2);
      assert.equal(
        (await read(sourceVersion)).payload.version_identifier,
        "synthetic-v1",
      );
      section = await create("SOURCE_SECTION", {
        source_version: sourceVersion.id,
      });
      citation = await create("CITATION", { section: section.id });
      const provenance = await call("versions/" + citation.id + "/provenance");
      assert.ok(
        provenance.sources.some(
          (r: { id: string }) => r.id === sourceVersion.id,
        ),
      );
      await assert.rejects(
        h.pool.query("UPDATE kb_versions SET title='modified' WHERE id=$1", [
          sourceVersion.id,
        ]),
        /immutable/,
      );
      await call(
        "records",
        {
          kind: "SOURCE_SECTION",
          data: { ...template("SOURCE_SECTION"), source_version: author.id },
        },
        ec,
        400,
      );
      await review(sourceVersion, "EDITORIAL");
      await review(citation, "EDITORIAL");
    },
  );
  await t.test(
    "review authority, forged fields and append-only decisions",
    async () => {
      await call(
        "versions/" + sourceVersion.id + "/reviews",
        {
          reviewer: reviewer.id,
          type: "EDITORIAL",
          decision: "APPROVE",
          comments: "forged",
        },
        pc,
        403,
      );
      await call(
        "records",
        {
          kind: "AUTHOR",
          data: { ...template("AUTHOR"), status: "PUBLISHED" },
        },
        ec,
        400,
      );
      await review(sourceVersion, "EDITORIAL", "REJECT");
      await review(sourceVersion, "EDITORIAL");
      assert.equal(
        (
          await h.pool.query("SELECT * FROM kb_reviews WHERE version_id=$1", [
            sourceVersion.id,
          ])
        ).rowCount,
        3,
      );
      await assert.rejects(
        h.pool.query(
          "UPDATE kb_reviews SET comments='tampered' WHERE version_id=$1",
          [sourceVersion.id],
        ),
        /immutable/,
      );
    },
  );
  await t.test(
    "equipment CRUD by immutable version and organization-neutral quantity semantics",
    async () => {
      const eq = await create("EQUIPMENT", {
        name: "Synthetic shared cone",
        mobility: "PORTABLE",
        quantity_semantics: "SHARED",
      });
      const next = await call(
        "versions/" + eq.id + "/versions",
        {
          expected_version: 1,
          data: { ...eq.payload, name: "Synthetic updated cone" },
        },
        ec,
        201,
      );
      assert.equal(next.version, 2);
      assert.equal((await read(eq)).payload.name, "Synthetic shared cone");
      await call(
        "versions/" + eq.id + "/versions",
        { expected_version: 1, data: eq.payload },
        ec,
        409,
      );
    },
  );
  await t.test(
    "rights UNKNOWN blocks; verified rights and media requirements are explicit",
    async () => {
      rights = await create("RIGHTS");
      media = await create("MEDIA_REQUIREMENT");
      exercise = await create("EXERCISE", {
        author: author.id,
        rights: rights.id,
        media_requirement: media.id,
        citations: [citation.id],
      });
      const result = await call(
        "versions/" + exercise.id + "/eligibility",
        undefined,
        pc,
      );
      assert.ok(result.reasons.includes("RIGHTS_NOT_ELIGIBLE"));
      assert.ok(result.reasons.includes("STILL_COUNT_INVALID"));
      assert.equal(media.payload.video_required, false);
      assert.equal(media.payload.media_requirement_type, "STILL_SEQUENCE");
      await call(
        "records",
        {
          kind: "MEDIA_REQUIREMENT",
          data: { ...template("MEDIA_REQUIREMENT"), video_required: true },
        },
        ec,
        400,
      );
      await call(
        "records",
        {
          kind: "MEDIA_REQUIREMENT",
          data: {
            ...template("MEDIA_REQUIREMENT"),
            required_views: ["UNRECOGNIZED"],
          },
        },
        ec,
        400,
      );
      rights = await call(
        "versions/" + rights.id + "/versions",
        {
          expected_version: 1,
          data: {
            ...rights.payload,
            classification: "FORMATION_ZERO_ORIGINAL",
            commercial_use_allowed: true,
          },
        },
        ec,
        201,
      );
      await review(rights, "RIGHTS");
    },
  );
  await t.test(
    "exact movement/capability taxonomy and schema/DB score constraints",
    async () => {
      const tax = await call("taxonomies");
      assert.deepEqual(tax.movements, [...MOVEMENTS]);
      assert.deepEqual(tax.capabilities, [...CAPABILITIES]);
      assert.throws(() =>
        parsePayload("EXERCISE", {
          ...exercise.payload,
          demand_profile: {
            ...(exercise.payload.demand_profile as object),
            impact_demand: 6,
          },
        }),
      );
      assert.throws(() =>
        parsePayload("EXERCISE", {
          ...exercise.payload,
          formation_suitability: {
            ...(exercise.payload.formation_suitability as object),
            Individual: -1,
          },
        }),
      );
      for (const field of ["demand_profile", "formation_suitability"]) {
        const p = {
          ...exercise.payload,
          [field]: {
            ...(exercise.payload[field] as object),
            [field === "demand_profile" ? "impact_demand" : "Individual"]: 6,
          },
        };
        await assert.rejects(
          h.pool.query(
            "INSERT INTO kb_versions(id,entity_id,version,previous_version,title,payload,created_by) VALUES($1,$2,2,$3,'bad',$4,$5)",
            [
              randomUUID(),
              exercise.entity_id,
              exercise.id,
              JSON.stringify(p),
              editor,
            ],
          ),
          /Score/,
        );
      }
    },
  );
  await t.test(
    "still asset metadata linked to reviewed rights; media publication gates and four eyes",
    async () => {
      const assets: V[] = [];
      for (const view of ["START", "KEY_POSITION", "FINISH"]) {
        const asset = await create("MEDIA_ASSET", {
          ...{ author: author.id, rights: rights.id },
          view,
        });
        await transition(asset, "APPROVE", pc, null, 409);
        await review(asset, "TECHNICAL");
        await review(asset, "RIGHTS");
        await grant("PUBLISHER");
        await transition(asset, "APPROVE", ec, null, 409);
        assets.push(await publish(asset));
      }
      exercise = await call(
        "versions/" + exercise.id + "/versions",
        {
          expected_version: 1,
          data: {
            ...exercise.payload,
            rights: rights.id,
            media_assets: assets.map((a) => a.id),
            secondary_movements: ["Carry"],
            secondary_capabilities: ["Balance"],
          },
        },
        ec,
        201,
      );
      const tags = (
        await h.pool.query("SELECT * FROM kb_tags WHERE version_id=$1", [
          exercise.id,
        ])
      ).rows;
      assert.equal(tags.length, 4);
      assert.equal(tags.filter((r) => r.is_primary).length, 2);
      for (const type of ["TECHNICAL", "SAFETY", "EDITORIAL", "RIGHTS"])
        await review(exercise, type);
      await grant("SAFETY_REVIEWER", editor, false);
      await transition(exercise, "APPROVE", pc, null, 409);
      await grant("SAFETY_REVIEWER");
      exercise = await publish(exercise);
    },
  );
  await t.test(
    "published payload/attachments immutable; version conflict; supersession and retirement retain history",
    async () => {
      await assert.rejects(
        h.pool.query("DELETE FROM kb_versions WHERE id=$1", [exercise.id]),
        /immutable/,
      );
      await assert.rejects(
        h.pool.query(
          "INSERT INTO kb_links(version_id,relation,target_id) VALUES($1,'equipment',$2)",
          [exercise.id, source.id],
        ),
        /Frozen/,
      );
      await call(
        "versions/" + exercise.id + "/reviews",
        {
          reviewer: reviewer.id,
          type: "TECHNICAL",
          decision: "REJECT",
          comments: "cannot mutate published review state",
        },
        ec,
        409,
      );
      const next: V = await call(
        "versions/" + exercise.id + "/versions",
        {
          expected_version: exercise.version,
          data: {
            ...exercise.payload,
            name: "Synthetic successor",
            parent_exercise: exercise.id,
            variant: "READY",
            relationships: [
              {
                type: "REGRESSION",
                target: exercise.id,
                notes: "Synthetic direction only",
              },
            ],
          },
        },
        ec,
        201,
      );
      assert.equal(
        (
          await h.pool.query(
            "SELECT * FROM kb_links WHERE version_id=$1 AND relation='REGRESSION' AND target_id=$2",
            [next.id, exercise.id],
          )
        ).rowCount,
        1,
      );
      assert.equal(
        (
          await h.pool.query(
            "SELECT * FROM kb_links WHERE version_id=$1 AND target_id=$2",
            [exercise.id, next.id],
          )
        ).rowCount,
        0,
      );
      for (const type of ["TECHNICAL", "SAFETY", "EDITORIAL", "RIGHTS"])
        await review(next, type);
      await publish(next);
      await transition(exercise, "SUPERSEDE", pc, next.id);
      assert.equal((await read(exercise)).status, "SUPERSEDED");
      await transition(next, "RETIRE");
      assert.equal((await read(next)).status, "RETIRED");
      assert.equal(
        (await read(exercise)).payload.name,
        template("EXERCISE").name,
      );
      await call(
        "versions/" + next.id + "/transitions",
        { action: "PUBLISH", expected_revision: 0, reason: "stale" },
        pc,
        409,
      );
    },
  );
  await t.test(
    "recovery author/review/version workflow without adaptive logic",
    async () => {
      recovery = await create("RECOVERY", {
        author: author.id,
        rights: rights.id,
        citations: [citation.id],
        relationships: [
          {
            target_type: "MOVEMENT",
            target: "Brace",
            notes: "Synthetic link only",
          },
        ],
      });
      for (const type of ["TECHNICAL", "SAFETY", "EDITORIAL", "RIGHTS"])
        await review(recovery, type);
      await publish(recovery);
      const next = await call(
        "versions/" + recovery.id + "/versions",
        { expected_version: 1, data: recovery.payload },
        ec,
        201,
      );
      assert.equal(next.status, "INGESTED");
    },
  );
  await t.test(
    "source, restriction, policy, expiry and changed-reviewer gates fail closed",
    async () => {
      const unverified = await create("SOURCE_VERSION", { source: source.id });
      const unverifiedSection = await create("SOURCE_SECTION", {
        source_version: unverified.id,
      });
      const unverifiedCitation = await create("CITATION", {
        section: unverifiedSection.id,
      });
      const restriction = await create("RESTRICTION", {
        source: section.id,
        reviewer: reviewer.id,
      });
      const subject = await create("EXERCISE", {
        author: author.id,
        rights: rights.id,
        media_requirement: media.id,
        citations: [unverifiedCitation.id],
        restrictions: [restriction.id],
        provenance: "OFFICIAL_DERIVED",
      });
      let result = await call(
        "versions/" + subject.id + "/eligibility",
        undefined,
        pc,
      );
      assert.ok(result.reasons.includes("SOURCE_VERIFICATION_REQUIRED"));
      assert.ok(result.reasons.includes("RESTRICTION_SAFETY_REVIEW_REQUIRED"));
      assert.ok(result.reasons.includes("REVIEW_REQUIRED:POLICY"));
      await review(unverified, "EDITORIAL");
      await review(restriction, "SAFETY");
      await review(subject, "POLICY");
      result = await call(
        "versions/" + subject.id + "/eligibility",
        undefined,
        pc,
      );
      assert.ok(!result.reasons.includes("SOURCE_VERIFICATION_REQUIRED"));
      assert.ok(!result.reasons.includes("RESTRICTION_SAFETY_REVIEW_REQUIRED"));
      assert.ok(!result.reasons.includes("REVIEW_REQUIRED:POLICY"));
      const today = (await h.pool.query("SELECT current_date::text AS date"))
        .rows[0].date;
      await call("versions/" + subject.id + "/reviews", {
        reviewer: reviewer.id,
        type: "POLICY",
        decision: "APPROVE",
        comments: "Synthetic expired review",
        re_review_date: today,
      });
      assert.ok(
        (
          await call("versions/" + subject.id + "/eligibility", undefined, pc)
        ).reasons.includes("REVIEW_REQUIRED:POLICY"),
      );
      const changed = await call(
        "versions/" + reviewer.id + "/versions",
        {
          expected_version: 1,
          data: { ...reviewer.payload, user_id: publisher },
        },
        ec,
        201,
      );
      assert.equal(
        (await call("versions/" + unverified.id)).verification.status,
        "UNVERIFIED",
      );
      reviewer = await call(
        "versions/" + changed.id + "/versions",
        { expected_version: 2, data: { ...changed.payload, user_id: editor } },
        ec,
        201,
      );
      const concurrent = await create("EQUIPMENT");
      const attempts = await Promise.all(
        [1, 2].map(() =>
          h.request(
            "/api/v1/knowledge/versions/" + concurrent.id + "/versions",
            { expected_version: 1, data: concurrent.payload },
            ec,
          ),
        ),
      );
      assert.deepEqual(attempts.map((r) => r.status).sort(), [201, 409]);
      await assert.rejects(
        h.pool.query(
          "INSERT INTO kb_links(version_id,relation,target_id) VALUES($1,'source_version',$2)",
          [unverifiedSection.id, author.id],
        ),
        /reference type/,
      );
    },
  );
  await t.test(
    "search/filtering, draft isolation, grants cannot be forged, audit survives failed transactions",
    async () => {
      const rows = await call(
        "records?kind=SOURCE&q=Synthetic%20API&provenance=FZ_ORIGINAL",
      );
      assert.ok(rows.length > 0);
      assert.ok(
        (
          await call(
            "records?kind=RECOVERY&status=PUBLISHED&rights=FORMATION_ZERO_ORIGINAL",
          )
        ).length > 0,
      );
      assert.ok((await call("records?review=APPROVE")).length > 0);
      assert.ok((await call("records?review=PENDING")).length > 0);
      await call("versions/" + recovery.id, undefined, uc, 403);
      await call("versions/" + recovery.id, undefined, "", 401);
      await call(
        "grants",
        { user_id: ordinary, permission: "PUBLISHER", enabled: true },
        ec,
        403,
      );
      const count = (await h.pool.query("SELECT count(*) FROM kb_versions"))
        .rows[0].count;
      await h.pool.query(
        "CREATE FUNCTION kb_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic audit failure'; END $$; CREATE TRIGGER kb_fail_audit BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION kb_fail_audit()",
      );
      await call(
        "records",
        { kind: "AUTHOR", data: template("AUTHOR") },
        ec,
        409,
      );
      assert.equal(
        (await h.pool.query("SELECT count(*) FROM kb_versions")).rows[0].count,
        count,
      );
      await h.pool.query("DROP TRIGGER kb_fail_audit ON audit_events");
      const actions = (
        await h.pool.query(
          "SELECT DISTINCT action FROM audit_events WHERE entity_type='KNOWLEDGE'",
        )
      ).rows.map((r) => r.action);
      for (const action of [
        "knowledge.rights.version_created",
        "knowledge.review.approve",
        "knowledge.lifecycle.publish",
        "knowledge.lifecycle.supersede",
        "knowledge.lifecycle.retire",
        "knowledge.permission.revoked",
      ])
        assert.ok(actions.includes(action), action);
      assert.ok(!h.logs.join("").includes("synthetic-private-credential"));
      assert.equal(PERMISSIONS.length, 8);
    },
  );
});
