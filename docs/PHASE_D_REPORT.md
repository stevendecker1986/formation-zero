# Phase D implementation report

## PHASE

Phase D — Deterministic Individual Prescription Engine

## STATUS

COMPLETE — every Phase D acceptance criterion passes.

## ARCHITECTURE

Framework-independent prescription-engine invokes Phase C for base eligibility and each dose. Shared server loaders preserve existing publication gates. Reviewed templates and content profiles define training behavior; no production defaults.

## REQUEST / SESSION MODEL

Thirteen objectives, ten sections, supplied context/facts, exact scope, preferences and explicit alternatives. Detailed schemas documented in PRESCRIPTION_REQUEST.md and SESSION_STRUCTURE.md.

## CANDIDATE ELIGIBILITY

Server-owned current production gates and active rule set. Actual B2 corpus stays unpublished. Fixed synthetic catalog is internal-only and never promoted.

## SELECTION / COMPOSITION

Deterministic bounded required-slot matching, P0–P10 precedence, movement balance, recovery cost/complexity, then preferences. Exact versions and explicit budgets; no duplicate content.

## VOLUME / INTENSITY / REST

Sets/reps, time, distance, intervals/rounds, supplied intensity interfaces, explicit rest/setup/transition, minimum rest and template buffer. Dose snapshots survive Phase C. No physiology calculation.

## PROGRESSION / REGRESSION / SUBSTITUTION

Exact Phase B edges or documented slot matching; blocked targets never reappear. Explicit request requires an eligible target.

## GOLDEN SCENARIOS

All 24 scenarios passed in the clean 101-test regression suite. The table below records each result. Actual B2 exclusion and immutable supersession history also passed PostgreSQL/API tests.

| #   | Scenario                        | Expected invariant                                          | Result |
| --- | ------------------------------- | ----------------------------------------------------------- | ------ |
| 01  | 45-minute general strength      | Required preparation/push/pull/lower/trunk structure fits   | PASS   |
| 02  | 30-minute no equipment          | No unavailable equipment selected                           | PASS   |
| 03  | 60-minute muscle development    | Additional lower-body slot                                  | PASS   |
| 04  | Running allowed                 | Eligible running selected                                   | PASS   |
| 05  | Running blocked                 | No running prescription                                     | PASS   |
| 06  | Synthetic rucking               | Pack-supported rucking                                      | PASS   |
| 07  | YELLOW                          | Phase C dose cap 2                                          | PASS   |
| 08  | ORANGE                          | Phase C dose cap 1                                          | PASS   |
| 09  | RED                             | Recovery-only or safe failure                               | PASS   |
| 10  | Equipment loss                  | Explicit eligible substitution                              | PASS   |
| 11  | Limited space                   | Large-space running excluded                                | PASS   |
| 12  | Overhead restriction            | Overhead preference suppressed                              | PASS   |
| 13  | Jump/high-impact restriction    | Jump excluded                                               | PASS   |
| 14  | Supplied recent lower-body load | C cap retained                                              | PASS   |
| 15  | No supervision                  | Technical candidate blocked                                 | PASS   |
| 16  | Equal-choice preference         | Preference breaks safe tie                                  | PASS   |
| 17  | Blocked preference              | Cannot restore equipment-blocked candidate                  | PASS   |
| 18  | Insufficient time               | Mandatory components never truncated                        | PASS   |
| 19  | No safe content                 | NO_SAFE_PRESCRIPTION                                        | PASS   |
| 20  | Unpublished B2                  | Production eligibility denial, actual corpus API regression | PASS   |
| 21  | Repeat                          | Identical material result                                   | PASS   |
| 22  | Shuffled input                  | Candidates/rules/doses/slots order-independent              | PASS   |
| 23  | Historical versions             | Prior result immutable; DB supersession regression          | PASS   |
| 24  | Objective structures            | Running and strength differ                                 | PASS   |

## FAILURE OUTCOMES

Eight defined/tested outcomes, including NO_SAFE_PRESCRIPTION. No failure weakens constraints. Malformed service envelopes are rejected.

## EXPLAINABILITY / PROVENANCE

Public-safe static rationale; restricted base/dose trace, exclusions and selection codes. Exact rule/reason/content/template versions, engine versions and keyed fingerprints. Generated time is a persistence envelope.

## IMMUTABLE HISTORY

Migration 007 blocks UPDATE/DELETE/TRUNCATE; actor-only history. Targeted PostgreSQL test confirms supersession does not alter a saved prescription.

## ADMIN / API

Internal synthetic catalog/request/result/history console. Ordinary USER denied. Production service rejects forged rule sets, status, candidate payloads and identity.

## SECURITY / PRIVACY

Raw facts transient, keyed fingerprints at service boundary, no sensitive generic logs, least-privilege runtime grants. Restricted traces remain sensitive derived data.

## DATABASE / FILES / ADRS

Migration 007_prescription_engine.sql; ADR 0015-prescription-construction.md. New prescription-engine package, service, console, tests and ten D documentation files. Modified knowledge schemas/templates/gates, shared C loaders/routes, runtime grants, smoke/regressions, workspace lockfile/dependencies and CI label. No prior migration modified.

### File inventory

| Change   | File                                                |
| -------- | --------------------------------------------------- |
| Modified | `.github/workflows/phase-a.yml`                     |
| Modified | `.prettierignore`                                   |
| Modified | `apps/admin/app/api/knowledge/[...path]/route.ts`   |
| Created  | `apps/admin/app/knowledge/prescription-console.tsx` |
| Modified | `apps/admin/app/knowledge/workspace.tsx`            |
| Created  | `database/migrations/007_prescription_engine.sql`   |
| Modified | `database/runtime-grants.sql`                       |
| Modified | `docs/ARCHITECTURE.md`                              |
| Modified | `docs/CHANGELOG.md`                                 |
| Created  | `docs/GOLDEN_PRESCRIPTION_SCENARIOS.md`             |
| Created  | `docs/PHASE_D_DIRECTIVE.md`                         |
| Created  | `docs/PHASE_D_PLAN.md`                              |
| Created  | `docs/PHASE_D_REPORT.md`                            |
| Created  | `docs/PRESCRIPTION_ENGINE.md`                       |
| Created  | `docs/PRESCRIPTION_EXPLAINABILITY.md`               |
| Created  | `docs/PRESCRIPTION_PROVENANCE.md`                   |
| Created  | `docs/PRESCRIPTION_REQUEST.md`                      |
| Modified | `docs/PRIVACY_DATA_CLASSIFICATION.md`               |
| Modified | `docs/SECURITY.md`                                  |
| Created  | `docs/SESSION_STRUCTURE.md`                         |
| Created  | `docs/SUBSTITUTIONS.md`                             |
| Modified | `docs/TESTING.md`                                   |
| Created  | `docs/VOLUME_INTENSITY_REST.md`                     |
| Created  | `docs/adr/0015-prescription-construction.md`        |
| Modified | `package-lock.json`                                 |
| Modified | `packages/knowledge/package.json`                   |
| Modified | `packages/knowledge/src/index.ts`                   |
| Modified | `packages/knowledge/src/rules.ts`                   |
| Modified | `packages/knowledge/src/templates.ts`               |
| Created  | `packages/prescription-engine/package.json`         |
| Created  | `packages/prescription-engine/src/fixtures.ts`      |
| Created  | `packages/prescription-engine/src/index.ts`         |
| Created  | `packages/prescription-engine/src/schemas.ts`       |
| Modified | `scripts/smoke.ts`                                  |
| Modified | `services/api/package.json`                         |
| Created  | `services/api/src/knowledge/prescriptions.ts`       |
| Modified | `services/api/src/knowledge/routes.ts`              |
| Modified | `services/api/src/knowledge/rules.ts`               |
| Modified | `services/api/src/knowledge/store.ts`               |
| Modified | `tests/api.test.ts`                                 |
| Modified | `tests/knowledge-runtime.test.ts`                   |
| Created  | `tests/prescription-api.test.ts`                    |
| Created  | `tests/prescription-engine.test.ts`                 |
| Modified | `tests/rule-api.test.ts`                            |

## TESTS / RESULTS

`npm test`: 101 passed, 0 failed, 0 skipped. `npm run validate:clean`: every step exited 0 at 2026-09-05T05:08:37.519Z. Fresh source directory: formation-zero-clean-V9jIeQ; fresh disposable PostgreSQL database migrated through 007, seeded and imported the exact 510-record corpus. B2 stayed 100 exercises/30 recoveries, 16 equipment records, 100 media requirements and zero production media/publications.

| Executed check                         | Actual result                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| Clean npm ci --no-fund                 | PASS                                                                           |
| Clean migrations 001–007, seed, corpus | PASS                                                                           |
| npm run format:check                   | PASS                                                                           |
| npm run lint                           | PASS, zero warnings                                                            |
| npm run typecheck                      | PASS, root/web/admin/mobile strict checks                                      |
| npm test                               | PASS, 101 tests                                                                |
| npm run security:secrets               | PASS                                                                           |
| npm run security:dependencies          | PASS, zero vulnerabilities                                                     |
| npm run licenses                       | PASS, 828 locked entries, no unresolved licenses                               |
| npm run security:clients               | PASS, 52 client artifacts                                                      |
| Expo doctor                            | PASS, 21/21                                                                    |
| npm run mobile:permissions             | PASS                                                                           |
| npm run smoke                          | PASS, built A/B/B2/C/D surfaces                                                |
| npm run ci:failure-probes              | PASS: invalid lint/types/tests/SQL rejected; migration transaction rolled back |
| Existing local db:migrate              | PASS: applied 007; repeated run returned no migrations                         |

Earlier failures were resolved: stopped/stalled PostgreSQL recovered without deleting data; a test callback typing error was corrected; the pre-existing development database's 006 checksum mismatch was traced to exact historical mixed newline bytes. Restoring those checksum-matching local bytes changed no SQL, Git-normalized migration content or ledger. The unchanged migration guard then applied 007 successfully. Local db:seed and db:corpus also passed (0 new/510 existing corpus records).

Local execution logs are retained in ignored validation-artifacts/clean-*.log and clean-results.json. They contain the actual commands/results, not simulated evidence.

Final review correction: rejected production templates now retain the exact requested template ID instead of a synthetic placeholder ID. Cross-editor history denial also has a direct regression assertion. Targeted PostgreSQL/API tests passed (8/8); full clean validation and actual hosted run 33946312038 also passed for this correction.

## BUILD RESULTS

PASS: optimized web and admin Next.js builds, API tsup build, and Expo web/Android/iOS exports from the clean source copy. Built smoke exercised synthetic prescription construction, saved history retrieval, authorization, origin protection and all prior phase surfaces.

## HOSTED CI

GitHub Actions / Phase A foundation / main / 2c7ae6ebf11e0d6d9aaffc7dfa906eebc1ddfe0b. Run [33965986622](https://github.com/stevendecker1986/formation-zero/actions/runs/33965986622): completed SUCCESS. The job passed install, complete A/B/B2/C/D validation, failure probes, artifact upload and cleanup. This main commit is the exact Phase D feature-branch commit previously validated by successful branch run 33946506456.

## ACCEPTANCE CRITERIA

| #   | Criterion                                                     | Status | Evidence                                                                                        |
| --- | ------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| 1   | all previous phases pass                                      | PASS   | Clean 101-test regression suite, including all A/B/B2/C tests.                                  |
| 2   | framework-independent prescription engine exists              | PASS   | packages/prescription-engine imports only Phase C, Zod and Node crypto.                         |
| 3   | Phase C cannot be bypassed                                    | PASS   | Base and each dose invoke C; golden 05, 12–15, 17, 19.                                          |
| 4   | production content eligibility server-enforced                | PASS   | Production API loads active rules and publishedEligibility server-side; rule-api D subtest.     |
| 5   | real pending B2 content remains non-prescribable              | PASS   | Actual B2 imported in API test; zero published; prescription denied.                            |
| 6   | synthetic fixtures isolated                                   | PASS   | Fixed synthetic catalog; mixed-mode/forged catalog tests.                                       |
| 7   | typed request/result works                                    | PASS   | Strict Zod construction/request schemas; exported Prescription result type; tsc passes.         |
| 8   | objective/session structures work                             | PASS   | All thirteen objectives test and golden 01–06, 24.                                              |
| 9   | time budget respected                                         | PASS   | Golden 02, 18; exact timing/rest/buffer arithmetic.                                             |
| 10  | deterministic ranking works                                   | PASS   | Golden 21–22; priority-vector and stable ID ordering.                                           |
| 11  | volume/intensity/rest works                                   | PASS   | Volume arithmetic, minimum-rest bounds and supplied intensity tests.                            |
| 12  | movement composition works                                    | PASS   | Golden 01/03/24; mandatory movement slots and no duplicate versions.                            |
| 13  | explicit progression/regression/substitution works            | PASS   | Golden 10 and progression/regression/blocked-target tests.                                      |
| 14  | blocked candidates never reappear                             | PASS   | Golden 05/12/13/15/17; permanent base eligibility gate.                                         |
| 15  | readiness/load/phase consumed, not calculated                 | PASS   | Golden 07–09/14; supplied Deload test; no calculation code.                                     |
| 16  | preference remains low priority                               | PASS   | Golden 12/16/17 and rank ordering.                                                              |
| 17  | explicit failure outcomes including NO_SAFE_PRESCRIPTION work | PASS   | All eight outcome tests and safe failure results.                                               |
| 18  | explainability/public-safe rationale works                    | PASS   | Public marker-absence test, base/dose internal trace and selection codes.                       |
| 19  | exact provenance recorded                                     | PASS   | Exact template/content/rule/reason versions and server HMAC tests.                              |
| 20  | saved history immutable/version-stable                        | PASS   | PostgreSQL UPDATE/DELETE/TRUNCATE denial and supersession history equality.                     |
| 21  | construction invariants work                                  | PASS   | Constructor required-slot/time/uniqueness assertions and tests.                                 |
| 22  | at least 24 golden scenarios pass                             | PASS   | Golden 01–24 PASS within 101 clean tests.                                                       |
| 23  | shuffled input does not change material output                | PASS   | Golden 22 reverses candidates/rules/doses/slots with identical result.                          |
| 24  | no Phase E validator exists                                   | PASS   | Source review: only local constructor assertions; no independent validator.                     |
| 25  | no COMMAND/Unit PT logic                                      | PASS   | Source review: individual structures only; no group logistics.                                  |
| 26  | no consumer workout UI                                        | PASS   | Only internal admin testing console added; consumer app unchanged.                              |
| 27  | security/privacy passes                                       | PASS   | API authorization/privacy/runtime-grant tests, source/client/security scans.                    |
| 28  | regressions/builds/security/license checks pass               | PASS   | Clean validate exited 0; 101 tests, builds/exports, scans/licenses/smoke.                       |
| 29  | hosted CI passes                                              | PASS   | Actual main-branch GitHub Actions run 33965986622 completed SUCCESS for Phase D commit 2c7ae6e. |
| 30  | docs reflect reality                                          | PASS   | This report records real commands, resolved failures and completed hosted CI.                   |

## KNOWN ISSUES

No unresolved implementation, merge, or validation failures. Phase D was fast-forwarded to main without rewriting history. Production training content still requires real reviews, rights clearance and publication; this is an enforced boundary, not an approval supplied by Phase D. The bounded search may return a safe failure when it cannot find a complete composition. No Phase E functionality was implemented.

## OPEN DECISIONS

No implementation or merge decision remains. Future real reviewers must author and approve production templates and dose profiles; no fabricated defaults.

## PHASE E READINESS

READY for separately authorized Phase E work. Phase E is not started. STOP.
