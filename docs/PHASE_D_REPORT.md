# Phase D implementation report

## PHASE

Phase D — Deterministic Individual Prescription Engine

## STATUS

INCOMPLETE — final clean validation and hosted CI pending.

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

All 24 core scenarios passed in targeted execution. See GOLDEN_PRESCRIPTION_SCENARIOS.md and tests/prescription-engine.test.ts for individual assertions. Final full-suite evidence pending.

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

## TESTS / RESULTS

Targeted core: 27 passed. Targeted PostgreSQL/API: 8 passed. Strict root tsc passed. Earlier API attempts failed because PostgreSQL was stopped/starting; local recovery completed without deleting data. One test callback typing error corrected. Full clean checks pending.

## BUILD RESULTS

Pending this phase.

## HOSTED CI

Pending this phase; no PASS claimed.

## ACCEPTANCE CRITERIA

| #   | Criterion                                                     | Status | Evidence                                                                        |
| --- | ------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| 1   | all previous phases pass                                      | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 2   | framework-independent prescription engine exists              | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 3   | Phase C cannot be bypassed                                    | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 4   | production content eligibility server-enforced                | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 5   | real pending B2 content remains non-prescribable              | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 6   | synthetic fixtures isolated                                   | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 7   | typed request/result works                                    | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 8   | objective/session structures work                             | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 9   | time budget respected                                         | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 10  | deterministic ranking works                                   | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 11  | volume/intensity/rest works                                   | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 12  | movement composition works                                    | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 13  | explicit progression/regression/substitution works            | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 14  | blocked candidates never reappear                             | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 15  | readiness/load/phase consumed, not calculated                 | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 16  | preference remains low priority                               | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 17  | explicit failure outcomes including NO_SAFE_PRESCRIPTION work | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 18  | explainability/public-safe rationale works                    | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 19  | exact provenance recorded                                     | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 20  | saved history immutable/version-stable                        | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 21  | construction invariants work                                  | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 22  | at least 24 golden scenarios pass                             | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 23  | shuffled input does not change material output                | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 24  | no Phase E validator exists                                   | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 25  | no COMMAND/Unit PT logic                                      | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 26  | no consumer workout UI                                        | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 27  | security/privacy passes                                       | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 28  | regressions/builds/security/license checks pass               | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 29  | hosted CI passes                                              | FAIL   | Final validation pending; implementation and targeted evidence described above. |
| 30  | docs reflect reality                                          | FAIL   | Final validation pending; implementation and targeted evidence described above. |

## KNOWN ISSUES

Final clean validation/build/security/license/smoke and hosted CI remain. Production training content requires real review and publication; this phase does not supply approvals.

## OPEN DECISIONS

None blocking implementation. Future real reviewers must author/approve production templates/dose profiles; no fabricated defaults.

## PHASE E READINESS

NOT READY — final Phase D validation pending. Phase E is not started.
