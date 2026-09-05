# Phase B2 implementation report

## PHASE

Phase B2 — Controlled Source & Content Population

## STATUS

INCOMPLETE — local validation passed; hosted CI is pending. No Phase C work.

## SOURCE MANIFEST

26 official sources: 11 USMC and 15 USU/CHAMP/HPRC; 5 orders, 3 MARADMINs, 3 program/index websites and 15 educational articles. Currency observations dated 2026-09-05 UTC: 22 CURRENT, 1 AMENDED, 3 PARTIALLY_SUPERSEDED. All 26 source rights records UNKNOWN. Key controlling records include MCO 6100.14, 6100.13A ADMIN CH-5, 1500.62, 6110.3A ADMIN CH-4 and 1500.59A, together with MARADMIN 613/25, 066/26 and 073/26. See [manifest](SOURCE_MANIFEST.md) for official links, exact scope and limitations. Research observations are not professional verification.

## EXERCISE CORPUS

100 candidates in four validated batches of 25. 20 of 21 primary movement categories and 18 of 23 primary capability categories represented. Aquatic intentionally excluded. All 100 INGESTED / FZ_DERIVED, with four professional review types pending. See [exercise inventory](INITIAL_EXERCISE_CORPUS.md).

## RECOVERY CORPUS

30 INGESTED / FZ_DERIVED candidates covering cooldown, mobility, active/aerobic recovery, breathing, sleep, hydration, general nutrition, reduced volume, post-run, post-ruck, post-high-intensity and post-field contexts. All four professional review types pending. See [recovery inventory](INITIAL_RECOVERY_CORPUS.md).

## EQUIPMENT

16 entries, all referenced; no unused catalog padding. Bodyweight uses no equipment reference. See [equipment catalog](EQUIPMENT_CATALOG.md).

## MEDIA BACKLOG

100 STILL_SEQUENCE requirements, each with START / KEY_POSITION / FINISH; higher-complexity records add COMMON_FAULT. Every record has video_required=false and technical_media_review_required=true and rights_review_required=true. No production assets generated or imported. Distribution is recorded in [media backlog](MEDIA_PRODUCTION_BACKLOG.md).

## AUTHORSHIP / QUALIFICATIONS

Codex-assisted draft preparation is identified separately from the founder. The two founder ISSA qualifications are owner-reported, INACTIVE/UNVERIFIED pending evidence; no credential identifiers, professional approvals or endorsement invented. No proprietary ISSA material ingested.

## RIGHTS / REVIEWS

156 UNKNOWN rights records; commercial use false. 510 corpus records: 26 DISCOVERED, 484 INGESTED, zero PUBLISHED. Zero real review events or approvals; 978 required review-type slots pending. Existing append-only histories and independent final approver rules remain. See [review backlog](CONTENT_REVIEW_BACKLOG.md).

## CITATION / PROVENANCE AUDIT

Every candidate has an exact source-version/section/citation chain supporting its stated principle context. No candidate cites a superseded or partially superseded policy source as its exercise authority. Instructions and ratings remain original, unverified editorial work; citations are not technique certification. Policy changes remain registry context with explicit scope.

## INTEGRITY AUDITS

Input audit: 510 records, exactly 100/30 candidates, 25 per exercise batch, 16 referenced equipment entries, 100 media requirements and zero media assets. Strict schema validation covers exact taxonomies, score dimensions/ranges and ordered valid references. Names/import keys are unique. All aliases are empty; distinct variants retain explicit lineage and editorial alternative links. No self-links. Provisional demand profiles vary across movements and require professional review. All 43 regression tests passed.

## ADMIN CMS

B2 corpus filter and authenticated safe JSON export added. Existing collection/status/provenance/rights/review filters and immutable editing retained. API integration passed real-corpus browse/filter/read/edit/history checks and anonymous/ordinary-user export denial. Built CMS smoke passed. Browser validation also passed real-corpus filtering, version-2 editing/history, and publication eligibility denial in an isolated disposable database.

## DATABASE / FILES / ADRS

Migration 005 adds immutable corpus membership only; migrations 001–004 unchanged. Operator-only import uses a disabled credential-free machine principal and existing schema/reference/audit insertion. Repeated identical import creates zero records; changed original input is rejected rather than overwriting edits. Normal later revisions use CMS version creation. Runtime has SELECT-only corpus membership access.

ADR 0013 records corpus/research/rights boundaries and strengthens official-provenance review to the B2 minimum. ADR 0012's approved supporting verification and four-eyes rules are preserved.

Created: database/corpus/{sources,exercises,batch2,batch3,batch4,recovery,equipment,records,import}.ts; database/migrations/005_controlled_corpus.sql; services/api/src/knowledge/corpus.ts; tests/corpus.test.ts; scripts/corpus-docs.ts; docs/PHASE_B2_DIRECTIVE.md; docs/PHASE_B2_PLAN.md; docs/SOURCE_MANIFEST.md; docs/INITIAL_EXERCISE_CORPUS.md; docs/INITIAL_RECOVERY_CORPUS.md; docs/EQUIPMENT_CATALOG.md; docs/MEDIA_PRODUCTION_BACKLOG.md; docs/CONTENT_REVIEW_BACKLOG.md; this report; docs/adr/0013-controlled-corpus-and-research-observations.md.

Modified: shared knowledge schemas; API knowledge store/routes; admin knowledge workspace/proxy; runtime grants; package scripts; clean-validation and smoke scripts; migration regression assertion; hosted workflow label; formatting exclusions; docs/CHANGELOG.md.

## TESTS / RESULTS

- Four batch commands: each 25 exercise and media schemas validated successfully.
- Full input audit: passed, 510 linked records.
- npm run db:migrate: applied 005 successfully to local database.
- npm run db:corpus: created 510 local records successfully.
- npm run typecheck: passed.
- npm run lint: passed.
- B2 PostgreSQL/API suite: 3 passed, 0 failed. An initial test assertion incorrectly treated eligibility's response object as an array; corrected without changing application behavior.
- npm test: 43 passed, 0 failed, 0 skipped.
- npm run validate:clean: passed all six steps (install, migrations, seed, corpus, validate, failure probes), completed 2026-09-05T01:38:48.334Z. Evidence: validation-artifacts/clean-results.json and clean-*.log (local generated artifacts).
- Formatting, strict typecheck, lint, secret scan, dependency audit (0 vulnerabilities), license inventory (828 locked entries), client-secret boundary (52 files), Expo Doctor (21/21), mobile permissions and all built smoke checks passed.
- Negative CI failure probes passed: deliberately invalid lint, types, tests and migration were rejected.

## BUILD RESULTS

Web and admin Next.js production builds, API build and Expo Android/iOS/web exports passed in clean validation.

## HOSTED CI

GitHub Actions / Phase A foundation / codex/phase-b2-corpus. Not yet pushed or executed for B2. No hosted PASS claimed.

## ACCEPTANCE CRITERIA

Final PASS/FAIL evidence pending required regression, build, smoke and hosted execution. Phase B2 remains INCOMPLETE until all 23 criteria are satisfied.

## KNOWN ISSUES

Hosted CI pending. Professional content reviews, source editorial verification, founder qualification verification, rights decisions and media production remain pending by design. No candidate is authorized for publication.

## OPEN DECISIONS

Before publication: founder attribution/evidence, real qualified reviewers and independent publisher, rights clearance and separately authorized media production. These are not fabricated to complete B2.

## PHASE C READINESS

NOT READY while B2 validation remains incomplete. Phase C is not authorized or implemented.
