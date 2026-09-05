import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { auditInputs, records, exercises } from "../database/corpus/records.js";
import { sources, checkedOn } from "../database/corpus/sources.js";
import { importCorpus } from "../database/corpus/import.js";
import { requiredReviews, parsePayload } from "@formation-zero/knowledge";
import { eligibility, get } from "../services/api/src/knowledge/store.js";
import { transaction } from "../services/api/src/db.js";
import { testHarness } from "./helpers.js";
test("B2 exact corpus, individually considered scores, citation and media integrity", () => {
  const a = auditInputs();
  assert.equal(a.records, 510);
  assert.equal(a.exercises, 100);
  assert.equal(a.recovery, 30);
  assert.equal(a.equipment, 16);
  assert.equal(
    new Set(exercises.map((e) => JSON.stringify(e.data.demand_profile))).size >
      40,
    true,
  );
  const seen = new Set<string>();
  for (const e of exercises) {
    assert.ok(!e.prior || seen.has(e.prior));
    seen.add(e.key);
    assert.equal(e.media.video_required, false);
    assert.equal(e.media.technical_media_review_required, true);
    assert.equal(e.media.rights_review_required, true);
    assert.equal(e.media.media_requirement_type, "STILL_SEQUENCE");
    assert.equal((e.data.cautions as string[]).length > 0, true);
    assert.equal(
      e.sources.every((k) =>
        sources.some((s) => s.key === k && s.status === "CURRENT"),
      ),
      true,
    );
  }
  assert.equal(
    records().filter((r) => r.kind === "MEDIA_ASSET" || r.kind === "REVIEWER")
      .length,
    0,
  );
  for (const r of records().filter((r) => r.kind === "RIGHTS")) {
    assert.equal(r.data.classification, "UNKNOWN");
    assert.equal(r.data.commercial_use_allowed, false);
  }
  assert.throws(
    () => auditInputs(records().filter((r) => r.key !== "exercise-100")),
    /Wrong EXERCISE count/,
  );
  assert.throws(
    () => auditInputs([...records(), records()[0]!]),
    /Duplicate key/,
  );
  const invalid = structuredClone(records());
  invalid.find((r) => r.key === "exercise-001")!.data.media_requirement =
    "@missing";
  assert.throws(() => auditInputs(invalid), /Unresolved reference/);
  assert.ok(!JSON.stringify(exercises).includes("ISSA"));
});
test("B2 research observations never fabricate currency, rights or review verification", () => {
  assert.match(checkedOn, /^2026-09-05$/);
  assert.equal(sources.length, 26);
  assert.equal(
    sources.find((s) => s.key === "bcp")!.status,
    "PARTIALLY_SUPERSEDED",
  );
  assert.equal(
    sources.find((s) => s.key === "change066")!.status,
    "PARTIALLY_SUPERSEDED",
  );
  assert.equal(sources.find((s) => s.key === "change073")!.status, "CURRENT");
  for (const s of sources) {
    assert.ok(
      new URL(s.url).hostname.endsWith("marines.mil") ||
        new URL(s.url).hostname === "www.hprc-online.org",
    );
    assert.ok(s.locator && s.principle && s.notes);
  }
  assert.deepEqual(
    new Set(requiredReviews("SOURCE", "OFFICIAL")),
    new Set(["TECHNICAL", "POLICY", "EDITORIAL", "RIGHTS"]),
  );
  assert.ok(requiredReviews("EXERCISE", "OFFICIAL").includes("SAFETY"));
  const sv = records().find((r) => r.kind === "SOURCE_VERSION")!;
  assert.throws(() =>
    parsePayload("SOURCE_VERSION", {
      ...sv.data,
      source: randomUUID(),
      currency_observation: {
        status: "CURRENT",
        checked_on: "not-a-date",
        evidence_url: "https://www.marines.mil/",
        scope: "test",
      },
    }),
  );
});
test("B2 actual migration/import, idempotency, CMS, safe export and publication denials", async (t) => {
  const h = await testHarness();
  t.after(h.close);
  assert.ok(h.migrations.includes("005_controlled_corpus.sql"));
  const first = await importCorpus(h.pool);
  assert.equal(first.created, 510);
  assert.equal((await importCorpus(h.pool)).created, 0);
  assert.equal(
    (await h.pool.query("SELECT count(*)::int n FROM kb_corpus_members"))
      .rows[0].n,
    510,
  );
  assert.equal(
    (
      await h.pool.query(
        "SELECT count(*)::int n FROM kb_reviews r JOIN kb_corpus_members m ON m.initial_version_id=r.version_id",
      )
    ).rows[0].n,
    0,
  );
  assert.equal(
    (
      await h.pool.query(
        "SELECT enabled FROM users WHERE id='b2-controlled-import'",
      )
    ).rows[0].enabled,
    false,
  );
  const password = "Synthetic-B2-Test-Password-829!";
  const admin = await h.register("b2-editor@example.invalid", password);
  await h.pool.query(
    "INSERT INTO user_roles(user_id,role) VALUES($1,'PLATFORM_ADMIN')",
    [admin],
  );
  const cookie = (await h.login("b2-editor@example.invalid", password)).cookie;
  const call = async (path: string, body?: unknown, expected = 200) => {
    const res = await h.request("/api/v1/knowledge/" + path, body, cookie);
    assert.equal(res.status, expected, await res.clone().text());
    return res.json();
  };
  assert.equal((await h.request("/api/v1/knowledge/corpus")).status, 401);
  const ordinary = await h.register("b2-user@example.invalid", password);
  assert.ok(ordinary);
  const uc = (await h.login("b2-user@example.invalid", password)).cookie;
  assert.equal(
    (await h.request("/api/v1/knowledge/corpus", undefined, uc)).status,
    403,
  );
  const exported = await call("corpus");
  assert.equal(exported.counts.kinds.EXERCISE, 100);
  assert.equal(exported.counts.kinds.RECOVERY, 30);
  assert.equal(exported.counts.review_events, 0);
  assert.equal(exported.counts.citation_coverage.exercises, 100);
  assert.equal(exported.counts.citation_coverage.recovery, 30);
  const json = JSON.stringify(exported);
  for (const privateKey of [
    "credential_identifier",
    "reviewer_user_id",
    "platform_user_id",
    "b2-editor@example.invalid",
    "Synthetic-B2-Test",
  ]) {
    assert.equal(json.includes(privateKey), false);
  }
  for (const kind of ["SOURCE", "EXERCISE", "RECOVERY", "EQUIPMENT"]) {
    const list = await call(
      `records?corpus=PHASE_B2_INITIAL&kind=${kind}&review=PENDING`,
    );
    assert.ok(list.length > 0);
    assert.ok(list.every((r: { kind: string }) => r.kind === kind));
  }
  assert.equal(
    (await call("records?corpus=PHASE_B2_INITIAL&kind=EXERCISE&offset=50"))
      .length,
    50,
  );
  const matches = await call(
    "records?corpus=PHASE_B2_INITIAL&kind=EXERCISE&q=Wall%20push-up&rights=UNKNOWN&provenance=FZ_DERIVED&status=INGESTED",
  );
  assert.equal(matches.length, 1);
  const v = matches[0];
  const full = await call(`versions/${v.id}`);
  assert.equal(full.history.length, 1);
  assert.equal(full.reviews.length, 0);
  const denied = await call(`versions/${v.id}/eligibility`);
  assert.equal(denied.eligible, false);
  const reasons = await transaction(h.pool, async (c) =>
    eligibility(c, await get(c, v.id), {
      userId: "b2-controlled-import",
      requestId: randomUUID(),
    }),
  );
  assert.ok(reasons.reasons.includes("FOUR_EYES_REQUIRED"));
  assert.ok(reasons.reasons.includes("RIGHTS_NOT_ELIGIBLE"));
  assert.ok(reasons.reasons.includes("SOURCE_VERIFICATION_REQUIRED"));
  await call(
    `versions/${v.id}/transitions`,
    {
      action: "PUBLISH",
      expected_revision: 0,
      reason: "Synthetic denial test",
    },
    403,
  );
  await call("grants", {
    user_id: admin,
    permission: "CONTENT_EDITOR",
    enabled: true,
  });
  const next = await call(
    `versions/${v.id}/versions`,
    {
      expected_version: 1,
      data: {
        ...full.payload,
        notes: "Synthetic CMS edit in disposable test database",
      },
    },
    201,
  );
  assert.equal(next.version, 2);
  assert.equal((await call(`versions/${next.id}`)).history.length, 2);
  assert.equal((await call("corpus")).counts.kinds.EXERCISE, 100);
  assert.equal((await importCorpus(h.pool)).created, 0);
  assert.equal(
    (await call("corpus")).records.find(
      (r: { key: string }) => r.key === "exercise-001",
    ).version,
    2,
  );
  await assert.rejects(
    h.pool.query(
      "DELETE FROM kb_corpus_members WHERE member_key='exercise-001'",
    ),
    /immutable/,
  );
  const sourceVersion = exported.records.find(
    (r: { kind: string }) => r.kind === "SOURCE_VERSION",
  );
  assert.equal(
    (await call(`versions/${sourceVersion.id}`)).verification.status,
    "UNVERIFIED",
  );
  const workflow = await readFile(".github/workflows/phase-a.yml", "utf8");
  assert.ok(workflow.includes("npm run validate"));
});
