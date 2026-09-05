# Phase C implementation report

## PHASE

Phase C — Deterministic Rule Engine

## STATUS

INCOMPLETE — final clean validation and hosted CI pending. No Phase D work.

## ARCHITECTURE

Framework-independent @formation-zero/rule-engine with browser-safe schemas and pure Node evaluation; no UI/HTTP/DB dependency in the core. Existing knowledge persistence, review controls and editorial permissions are reused. See RULE_ENGINE.md and ADR 0014. Audited baseline: clean main e78359dcad9cabe49ba9dcb0fb436c587e4790e5, B2 hosted run 33937844501 successful.

## RULE MODEL

Permanent FZ-RULE / FZ-RSN / FZ-RSET IDs, immutable version payloads, exact references, author/rights/citations, effective intervals/population, timestamps, append-only reviews and supersession/retirement. Seven rule types and 13 typed effects. Safe bounded declarative conditions with explicit missing/null/UNKNOWN behavior. All fixture thresholds and policy facts are synthetic.

## PRIORITY / CONFLICT RESOLUTION

Exact centralized P0 SAFETY through P12 OPTIMIZATION. Higher-priority same-key constraints win; same-priority caps use the restrictive minimum; incompatible attributes block. Permanent ID/version/canonical-effect order resolves remaining ties. Blocks cannot be cleared. Preference/optimization conditions are constrained to P11/P12. Scores rank eligible candidates only; no selection or workout construction.

## INITIAL RULE FIXTURES

19 synthetic INGESTED rules, 19 pending reason versions and one synthetic set; author and UNKNOWN rights add two supporting records. No real reviews, published rules or production activation.

Priority counts P0–P12: 3, 3, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1.

Types: HARD_BLOCK 9; MODIFICATION 3; ELIGIBILITY 1; REQUIREMENT 1; SCORE_ADJUSTMENT 3; SOFT_PREFERENCE 1; INFORMATIONAL 1. All seeding is LOCAL/TEST only and idempotent. Production-path integration fixtures and approval actions exist only in disposable test databases and are explicitly synthetic test evidence, not real approvals.

## GOLDEN SCENARIOS

All 16 scenarios passed locally: (1) no-running preference conflict; (2) overhead restriction; (3) supplied soreness/load; (4) RED readiness; (5) unavailable equipment; (6) unsafe surface jump/sprint; (7) complexity/supervision; (8) eligible preference ranking; (9) policy population/date; (10) unpublished candidate; (11) same-priority cap conflict; (12) no-safe-option; (13) repeated 1,000-candidate determinism; (14) P12 resurrection denial; (15) unknown safety fact; (16) unsafe equipment/provider exclusion. Detailed expected outcomes: GOLDEN_RULE_SCENARIOS.md.

## REASON CODES / EXPLAINABILITY

Stable versioned static reasons and engine invariant codes; no fact interpolation. Trace includes considered/matched/unknown/out-of-date rules, priority, applied/suppressed/conflicting effects, constraints, reasons, blocked candidates and warnings. Canonical input fingerprint and deterministic evaluation ID identify material output. See REASON_CODES.md and RULE_EXPLAINABILITY.md.

## CONTENT ELIGIBILITY

Production API accepts candidate version UUIDs, not client metadata or approval flags. It resolves exact active rule sets and current eligibility under the editorial lock, revalidating published status, reviews, rights, sources, transitive references and media. Real B2 import remains 100/30 with zero new records on rerun; the API test confirms pending B2 content yields NO_SAFE_ELIGIBLE_OPTION under an isolated activated test production-path set. No B2 promotion occurs.

## RULE SETS / VERSIONING

Exact rule/reason versions; no implicit latest resolution. Published payloads immutable. Activation appends an auditable exact set reference and rejects synthetic/draft/ineligible sets. Superseded/retired references invalidate subsequent production evaluation. Facts are transient; retained provenance includes keyed fingerprint, exact versions, constraints and reason codes plus evaluated_at. Core output excludes timestamps/random audit IDs.

## ADMIN / API

Existing CMS collections cover rule/reason/set fields, reviews, provenance and lifecycle. Rule console supports explicit activation/history and validated JSON constraint evaluation. Authentication and existing editorial grants protect all routes; PUBLISHER is required for activation, PLATFORM_ADMIN alone is insufficient. Production set/status forgery is rejected. Retained evaluation reads require the original actor and current editorial access.

## SECURITY / PRIVACY

No executable database rules, prototype paths or unbounded conditions. Existing origin/cookie/body/rate/error controls remain. Raw facts are not persisted, echoed or logged. Stored domain-separated HMAC fingerprint is distinct from transient canonical hash. Generic audit contains IDs/counts only. Evaluation provenance is restricted health-adjacent inference data, separated from analytics. Runtime cannot update/delete/truncate activation/evaluation history. No consumer evaluation service or real-data retention policy is introduced.

## DATABASE / FILES / ADRS

Migration 006_rule_engine.sql applied locally; migrations 001–005 unchanged. Added immutable rule activation/evaluation tables and knowledge kind/reference support. Seed/import reruns preserve B2 records. ADR 0014 documents architecture, gate reuse, determinism and privacy decisions.

Created: packages/rule-engine/package.json and src/{schemas,index,fixtures}.ts; packages/knowledge/src/rules.ts; services/api/src/knowledge/rules.ts; database/migrations/006_rule_engine.sql; database/seeds/rules.ts; apps/admin/app/knowledge/rule-console.tsx; tests/rule-engine.test.ts; tests/rule-api.test.ts; docs/PHASE_C_DIRECTIVE.md; docs/PHASE_C_PLAN.md; docs/RULE_ENGINE.md; docs/RULE_PRIORITY.md; docs/RULE_CONDITIONS_EFFECTS.md; docs/REASON_CODES.md; docs/RULE_EXPLAINABILITY.md; docs/GOLDEN_RULE_SCENARIOS.md; docs/RULE_REVIEW_AND_VERSIONING.md; this report; ADR 0014.

Modified: knowledge schemas/templates/package; API app/knowledge routes/store; admin workspace/proxy; runtime grants/seeds; migration/runtime tests; built smoke; lockfile; workflow label; formatting exclusion; architecture/security/privacy/testing/changelog documentation. No branding, entitlement or prescription implementation changed.

## TESTS / RESULTS

- Core/golden suite: 20 passed before final additional priority-ownership test.
- PostgreSQL/API suite: 6 passed, including actual B2 boundary, lifecycle and private provenance.
- Full regression run: 69 passed initially; clean validation subsequently passed all 70 tests, zero failed.
- Local migration 006, seed and B2 import rerun passed; import created 0, existing 510.
- Lint passed after removing unused destructured fields; strict typecheck passed during development.
- First clean run passed install/migrations/seeds/corpus, format/lint/types, 70 tests, secret/dependency scans (0 vulnerabilities), license inventory (828 entries) and web build. Admin webpack then rejected a .js import of the new TypeScript schema. Corrected to the existing extensionless browser-import convention; full clean rerun is pending.
- Generic CMS rule-definition editing was extended with a validated JSON-object editor so conditions can change structure. No gate or check weakened.

## BUILD RESULTS

Web build passed in the first clean run; corrected admin module resolution and final editor are undergoing a full clean rerun. API/mobile exports and built smoke results remain pending.

## HOSTED CI

GitHub Actions / Phase A foundation / codex/phase-c-rule-engine. Phase C not yet pushed; hosted result pending.

## ACCEPTANCE CRITERIA

Final 26-criterion PASS/FAIL matrix pending final clean/hosted validation. Phase C remains INCOMPLETE until every criterion passes.

## KNOWN ISSUES

Final validation/CI incomplete. No production rule library is approved or activated; all shipped rules are synthetic pending fixtures. Real B2 content remains unpublished. These are intentional Phase C boundaries, not permission to fabricate approval.

## OPEN DECISIONS

Future real rule/content reviews and source/rights approval; production retention/deletion policy before collecting real health-adjacent evaluation data; separate Phase D authorization. No current implementation decision requires bypassing owner-approved controls.

## PHASE D READINESS

NOT READY while Phase C validation remains incomplete. Phase D is not authorized or implemented.
