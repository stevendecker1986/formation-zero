# PHASE

Phase B — Knowledge Base Foundation

# STATUS

INCOMPLETE only because supporting-record verification policy requires the owner decision recorded in ADR 0012. Final clean validation and actual hosted CI passed. Phase B2 and Phase C have not begun.

# INITIAL STATE

Clean `main` at `72d107c8e045d705dc2f600a4fa3f7902b73fc8e`, synchronized 0 ahead/0 behind with `https://github.com/stevendecker1986/formation-zero.git`. Phase A and Amendment 001 existed: Next web/admin, Expo mobile, Express/Better Auth, PostgreSQL migrations 001–003, exact consumer roles and entitlement catalog, immutable audit, shared branding and 26 regression tests. No knowledge schema or CMS existed. The full directive and execution authorization were read before changes; audit/requirement comparison and plan preceded major implementation. `docs/PHASE_B_DIRECTIVE.md` preserves the supplied file (SHA256 `43DB5E1B10C1AE90EF35BF5C753A1CFCE132E6CFC40A33CC59B00400F13C25FF`).

# ARCHITECTURE IMPLEMENTED

Strict typed knowledge workspace; immutable entity/version envelopes; typed exact-version FK links; exact taxonomies; separate lifecycle projection, reviews and grants. Authenticated Express APIs and a Next admin CMS reuse Phase A authentication and Amendment 001 tokens. Transactional audit, advisory serialization and stale-write checks protect editorial operations. No public knowledge endpoint, new consumer permissions, billing activation, media processing or fitness engine.

# DATABASE MIGRATIONS

`004_knowledge.sql`: isolated kb entities/versions/states/links/taxonomies/tags/grants/reviews, permanent-code sequence, review-order identity, integrity/immutability triggers, and KNOWLEDGE audit entity type. Migrations 001–003 unchanged. Applied successfully to the existing development database and a new disposable clean database; synthetic seed succeeded. Forward/backup strategy and runtime grants documented in KNOWLEDGE_BASE.md. Runtime-grant test verifies writes/locks work and history mutation/DDL fail.

# FILES CREATED

- `apps/admin/app/api/knowledge/[...path]/route.ts`
- `apps/admin/app/knowledge/page.tsx`
- `apps/admin/app/knowledge/workspace.tsx`
- `database/migrations/004_knowledge.sql`
- `database/seeds/knowledge.ts`
- `packages/knowledge/package.json`
- `packages/knowledge/src/index.ts`
- `packages/knowledge/src/templates.ts`
- `services/api/src/knowledge/routes.ts`
- `services/api/src/knowledge/store.ts`
- `tests/knowledge.test.ts`
- `tests/knowledge-runtime.test.ts`
- `docs/PHASE_B_DIRECTIVE.md`
- `docs/PHASE_B_PLAN.md`
- `docs/PHASE_B_REPORT.md`
- `docs/KNOWLEDGE_BASE.md`
- `docs/CONTENT_LIFECYCLE.md`
- `docs/SOURCE_PROVENANCE.md`
- `docs/RIGHTS_MANAGEMENT.md`
- `docs/AUTHORSHIP_AND_REVIEW.md`
- `docs/MEDIA_CONTENT_MODEL.md`
- `docs/ADMIN_CMS.md`
- `docs/SECURITY.md`
- `docs/PRIVACY_DATA_CLASSIFICATION.md`
- `docs/TESTING.md`
- `docs/CHANGELOG.md`
- `docs/adr/0010-immutable-knowledge-envelope.md`
- `docs/adr/0011-editorial-authority-and-publication.md`
- `docs/adr/0012-supporting-record-verification.md`

# FILES MODIFIED

- `README.md`
- `DEVELOPMENT.md`
- `docs/OPEN_DECISIONS.md`
- `.gitattributes`
- `.prettierignore`
- `.github/workflows/phase-a.yml`
- `apps/admin/app/page.tsx`
- `apps/admin/next.config.ts`
- `apps/admin/package.json`
- `database/runtime-grants.sql`
- `database/seeds/seed.ts`
- `docs/ARCHITECTURE.md`
- `package-lock.json`
- `packages/ui/src/theme.css`
- `scripts/smoke.ts`
- `services/api/package.json`
- `services/api/src/app.ts`
- `tests/api.test.ts`

Existing Phase A migration SQL, authentication implementation, entitlement mapping, mobile product code and brand artwork are unchanged. Ignored temporary logs, test helpers and build outputs are excluded from these source inventories and from commits.

# ADRS

- 0010: typed immutable knowledge envelope, permanent codes and serialized editorial transactions; accepted technical decision.
- 0011: owner-approved separate editorial grants, required reviews and independent final approval.
- 0012: proposed supporting-record verification mapping; pending explicit owner answer.

# SOURCE REGISTRY

Sources, immutable source versions, granular sections and multi-citation references are operational. Source/provenance lookup follows exact-version links. Source/citation verification dates/reviewers derive from append-only decisions; the mapping to EDITORIAL remains provisional. Locators and bounded notes replace bulk copied source text.

# AUTHORSHIP / QUALIFICATIONS / REVIEWS

Separate authors, credentials, reviewer identities, type/specialty-specific grants and append-only review decisions. Credential identifiers are excluded from normal read/list responses and preserved across edits that omit the private field. Revoked authority, expired reviews, changed reviewer identity and missing reviews fail gates. Qualifications confer no rights or permissions; no ISSA endorsement or courseware use.

# EXERCISE MODEL

Exact 21 movements and 23 capabilities, primary/secondary tags, 14 integer demand scores, complexity 1–5, six formation suitability scores and individual suitability, equipment/scaling/restrictions, authorship/citations/rights, still requirements and explicit parent/variant/directional relationships. Schema and database reject invalid scores. Stored metadata only; no prescription, assessment or scoring logic.

# RECOVERY MODEL

Versioned methods with purpose, category, use, demand/intensity, duration guidance, equipment/body area and exact exercise/movement/capability or descriptive training/stress relationships. Real synthetic create/review/publish/new-version workflow tested. No adaptive recovery.

# MEDIA MODEL

STILL_SEQUENCE defaults with START/KEY_POSITION/FINISH, 1–4 still capacity, optional alternate/fault/regression/progression views, optional video with video_required false. Asset metadata links creator, author, rights and technical review. Duplicate version references are rejected so repeating one asset cannot inflate image counts; a regression assertion covers this. No production image/video generated or imported. Synthetic metadata-only asset publication proves still-count/view/review gates.

# RIGHTS / PUBLICATION

UNKNOWN/unresolved third-party rights block publication. Commercial-use flag, current rights version, explicit review and license/permission evidence are checked. Central API gates enforce required reviews, sources, authorship, four-eyes approval, expected revision and published media. Published payloads and attachments are immutable; new versions, supersession and retirement retain history. Supporting verification mapping is provisional: this prevents declaring the workflow policy final, despite passing synthetic execution tests.

# ADMIN CMS

Authenticated collections, typed scalar/nested fields, validated JSON relationship arrays, search/filter/pagination, review queue, history, provenance/rights/eligibility lookup, reviewer submissions, lifecycle actions and grant management. Built Next proxy/SSR access tests pass. Real browser test created equipment version 1, saved version 2 and reopened unchanged version 1. Test account/data were isolated and disposed after the test.

# SECURITY / PRIVACY

Enabled-account sessions, HttpOnly cookies, origin/body validation, strict schemas, safe errors, parameterized SQL, no external locator fetch, no HTML/code execution and no public draft/review/audit reads. Separate least-privilege deployment grants tested against a real temporary PostgreSQL role. No extra health/location/unit data; credentials private by default. Legal commercial gate remains false. Main remains the passing Phase A/Amendment baseline while the proposed verification policy is reviewed.

# AUDIT

Transactional events cover every kind's version creation (including provenance, rights and qualifications), review decisions/verification, grant/revocation, submit/approve/publish/supersede/retire. Audit contains identifiers/reasons, not private credential values. A simulated audit insertion failure rolls back content creation. Existing append-only audit controls are preserved.

# TESTS

`tests/knowledge.test.ts`: 12 workflow subtests plus parent test; real authenticated HTTP and PostgreSQL, including source/review/media/publication, constraint, expiry/revocation, concurrent version conflict and audit rollback cases. `tests/knowledge-runtime.test.ts`: real runtime-grant test. Existing 26 tests retained; the migration-list assertion adds 004 only. `scripts/smoke.ts` adds actual built CMS proxy, SSR, grant, creation/read and denial checks. Browser smoke separately verifies interactive versioning.

# TEST RESULTS

- Initial clean validation: installation, migrations, seed, format, lint, strict typecheck, 39 automated tests (0 failures), secrets/dependency scans (0 vulnerabilities), licenses, builds, Expo doctor 21/21, permission/client-secret boundaries and built smoke all exit 0.
- Additional runtime-grant test: 1 test, 1 pass, 0 failures.
- `npm run db:migrate`: 004 applied; `npm run db:seed`: success.
- `npm run smoke:dev`: API, Next web/admin and Expo Metro passed.
- Failure probes: lint/typecheck/test deliberately rejected invalid inputs and migration failure rolled back; probe command exit 0.
- Final `npm run validate:clean` completed 2026-09-04T23:50:41Z, including duplicate-reference rejection: fresh install, migrations, seed, full validation and failure probes all exit 0. **40 tests passed, 0 failures, 0 skipped**. Format, lint, strict typecheck, secrets/client scans, dependency audit (0 vulnerabilities), 828-entry license review, all builds/exports, Expo doctor (21/21), permission check and built smoke passed. Evidence: ignored `validation-artifacts/clean-results.json` and `clean-*.log` files. Final documentation updates are additionally format-checked before commit and covered by hosted CI.

# BUILD RESULTS

Final clean run: Next web/admin production builds, API tsup build and Expo web/Android/iOS exports passed; built web/admin/API smoke passed. Exports are not signed native device binaries; no device-install claim is made.

# HOSTED CI

GitHub Actions, workflow **Phase A foundation**, branch `codex/phase-b-foundation`, implementation commit `cd03015d92caec99aca81c4c11916188c0b2034b`. [Run 33930991775](https://github.com/stevendecker1986/formation-zero/actions/runs/33930991775) completed **SUCCESS** at 2026-09-04T23:53:20Z; validation job `101209366590`. Actual downloaded job logs confirm 40 tests passed, 0 failed/skipped; dependency audit 0 vulnerabilities; 828 license entries; web/admin/API builds; Expo exports and doctor 21/21; client/permission scans; built CMS/account smoke; all four failure probes. No hosted failure or check weakening was required. Existing install/validation/failure-probe/artifact steps were retained. The branch keeps provisional supporting policy separate from main until the owner decision is resolved.

# ACCEPTANCE CRITERIA

PASS below means the listed implemented behavior was exercised or inspected as identified. It does not imply approval of the pending supporting policy. Full Phase B remains INCOMPLETE until every row and the change-control decision are satisfied.

| #   | Criterion                                   | Status | Evidence                                                                                            |
| --- | ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| 1   | Phase A remains passing                     | PASS   | All 26 baseline tests retained and passed in initial clean validation; account/build smoke passed   |
| 2   | Amendment 001 intact                        | PASS   | Contrast test, unchanged artwork/tokens/positioning; CMS reuses shared theme                        |
| 3   | Knowledge-domain separation                 | PASS   | kb schema and knowledge package; no profile/entitlement schema changes                              |
| 4   | Source registry works                       | PASS   | Real API source creation, search and source-chain test                                              |
| 5   | Source versions historical/immutable        | PASS   | New version plus original read and rejected SQL update                                              |
| 6   | Source sections/citations work              | PASS   | Typed section FK and provenance lookup tests                                                        |
| 7   | Authorship separate from provenance         | PASS   | AUTHOR references independent of provenance enum                                                    |
| 8   | Qualifications separate from sources/rights | PASS   | Dedicated QUALIFICATION kind, redaction and version-preservation test                               |
| 9   | Reviewer identities/append history          | PASS   | Identity/grant checks, appended decisions and rejected SQL update                                   |
| 10  | Four-eyes capability                        | PASS   | Same creator/approver denied; separate publisher succeeds                                           |
| 11  | Movement taxonomy                           | PASS   | Exact 21 values and primary/secondary tags                                                          |
| 12  | Capability taxonomy                         | PASS   | Exact 23 values and primary/secondary tags                                                          |
| 13  | Exercise schema                             | PASS   | Real strict-schema/API exercise creation                                                            |
| 14  | Demand validation                           | PASS   | Schema and SQL range rejections                                                                     |
| 15  | Formation suitability                       | PASS   | Exact six dimensions and range rejections                                                           |
| 16  | Exercise variants/relationships             | PASS   | Parent/variant and directional REGRESSION relationship test                                         |
| 17  | Equipment catalog                           | PASS   | API and browser create/new-version/read                                                             |
| 18  | Recovery schema                             | PASS   | Real create/review/publish/new-version test                                                         |
| 19  | Still-sequence requirements                 | PASS   | Default counts/views and linked asset publication tests                                             |
| 20  | Video optional by default                   | PASS   | False default; true rejected                                                                        |
| 21  | Technical media review representable        | PASS   | Explicit TECHNICAL asset decisions required and tested                                              |
| 22  | Rights records work                         | PASS   | Versioned record creation, review and reference tests                                               |
| 23  | UNKNOWN blocks publication                  | PASS   | Gate returns RIGHTS_NOT_ELIGIBLE                                                                    |
| 24  | Server-side publication eligibility         | FAIL   | Implementation/tests work, but supporting verification mapping is not yet owner-approved (ADR 0012) |
| 25  | Published versions immutable                | PASS   | DB payload/attachment rejection; new version preserves original                                     |
| 26  | Supersede/retire retain history             | PASS   | Successor/retirement transitions and old reads tested                                               |
| 27  | Admin CMS works                             | PASS   | Built proxy/SSR smoke plus interactive browser create/version/history                               |
| 28  | Editorial authorization works               | PASS   | Ordinary/anonymous denial; admin has no implicit publishing grant                                   |
| 29  | Draft/review content not public             | PASS   | All knowledge routes authenticated/authorized; denial tests                                         |
| 30  | Critical editorial audit                    | PASS   | Event assertions and transaction rollback on failed audit                                           |
| 31  | Only synthetic fixtures                     | PASS   | Seed and tests use explicitly synthetic metadata/disabled seed identities                           |
| 32  | No bulk corpus                              | PASS   | File/seed review; no external document/media import                                                 |
| 33  | No Phase C logic                            | PASS   | Scope/code review: metadata and editorial operations only                                           |
| 34  | All tests pass                              | PASS   | Final clean run: 40 passed, 0 failed, 0 skipped                                                     |
| 35  | Hosted CI passes                            | PASS   | Actual GitHub run 33930991775 completed SUCCESS                                                     |
| 36  | Documentation reflects reality              | PASS   | Current-state docs, provisional policy and actual evidence distinguished                            |

| Action                     | Status | Evidence                                                                              |
| -------------------------- | ------ | ------------------------------------------------------------------------------------- |
| A1 Audit/plan              | PASS   | PHASE_B_PLAN written before major schema work                                         |
| A2 Domain/schema           | PASS   | Strict typecheck and exact enum/range tests                                           |
| A3 Migrations              | PASS   | Clean migrations 001–004, constraints/runtime test, documented forward strategy       |
| A4 Sources                 | PASS   | Source/version/section/citation and historical read tests                             |
| A5 Authorship/review       | PASS   | Separate models, redaction, append history and four-eyes tests                        |
| A6 Exercises               | PASS   | Taxonomy/range/directional/variant tests; no prescriptions                            |
| A7 Equipment               | PASS   | API/browser version CRUD and quantity semantics                                       |
| A8 Recovery                | PASS   | Real author/review/publish/version flow; no adaptation                                |
| A9 Media                   | PASS   | Still count/views, optional video, technical review tests                             |
| A10 Rights                 | FAIL   | Functional gates pass tests; supporting verification policy remains provisional       |
| A11 Publication            | FAIL   | Functional lifecycle passes tests; supporting verification policy remains provisional |
| A12 Admin CMS              | PASS   | Built and interactive browser workflows; denial tests                                 |
| A13 APIs                   | PASS   | Strict input, private drafts and authority-forgery rejection                          |
| A14 Search                 | PASS   | Collection/name/status/provenance/rights/review filters tested                        |
| A15 Audit                  | PASS   | Critical events, immutable storage and rollback tests                                 |
| A16 Tests                  | PASS   | 40 tests and production/development/browser smoke passed                              |
| A17 CI                     | PASS   | Clean local and hosted run 33930991775 pass                                           |
| A18 Documentation          | PASS   | Required docs/ADRs report implementation and open policy accurately                   |
| A19 Final clean validation | PASS   | Local install/migrate/seed/validate/probes and actual hosted run pass                 |

# KNOWN ISSUES

Supporting-record verification mapping is provisional. No other implementation blocker is currently known. Relationship arrays use an explicitly documented JSON editor, not a bulk content authoring tool. Production rights/media/content population has not been attempted. Toolchain deprecation notices are present in dependency/Actions logs; checks passed with no reported dependency vulnerabilities or unresolved license inventory entries.

# OPEN DECISIONS

ADR 0012: approve EDITORIAL verification for source versions/citations and other registry metadata, RIGHTS for rights records, TECHNICAL for qualification records, or provide a different mapping. This is separate from the two owner approvals already received. The directive's change-control section requires stopping affected product semantics rather than guessing.

# PHASE B2 READINESS

NOT READY. Resolve ADR 0012 before declaring Phase B complete. Local and hosted validation pass. No Phase B2 or Phase C work has begun.
