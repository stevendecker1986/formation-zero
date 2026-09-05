# FORMATION ZERO — CODEX RCGOA MASTER DIRECTIVE
## Phase D — Deterministic Individual Prescription Engine
### Authority: v1.0-PLAN + Amendment 001 + Completed A/B/B2/C
### Scope: PHASE D ONLY

# R — ROLE
Continue as Formation Zero's software, training-systems, prescription, safety, provenance, security, testing, and documentation lead. A, Amendment 001, B, B2 and C are COMPLETE with hosted CI passing. Implement **Phase D only**. Do not begin Phase E.

Do not override Phase C, promote unapproved B2 content, calculate readiness/training load, build long-term programs, COMMAND/Unit PT, Live PT, GPS, health integrations, billing, or consumer workout UI.

# C — CONTEXT
Formation Zero is a universal human-performance platform. Phase C provides deterministic P0–P12 constraints, hard blocks, reason codes, explainability, version provenance, and production-content eligibility.

Phase D is subordinate to Phase C.

The Prescription Engine answers: **Given an authorized individual training context, eligible content, Phase C constraints, objective, time, equipment, and externally supplied readiness/load/program facts, what individual session can be constructed?**

It may select only candidates surviving Phase C. It can never override a hard block, resurrect an excluded candidate, silently relax safety, or use unapproved production content.

`NO_SAFE_PRESCRIPTION` is valid.

Real B2 exercise/recovery candidates remain non-prescribable until real review/rights/publication gates pass. Use isolated synthetic production-eligible fixtures for development/testing. Never change B2 states to make Phase D work.

Phase D constructs a candidate prescription. Phase E will independently validate it later. Do not implement Phase E now.

# G — GOAL
Implement a deterministic, explainable, versioned individual Prescription Engine that:
1. accepts typed prescription requests
2. invokes Phase C
3. forms only eligible candidate pools
4. selects session structure
5. selects exercises deterministically
6. assigns volume/intensity/rest/time
7. consumes externally supplied phase/readiness/load constraints
8. respects time/equipment/space
9. uses explicit regressions/substitutions
10. supports preparation/main/accessory/conditioning/recovery sections as appropriate
11. produces complete individual candidate sessions
12. emits reason codes/rationale
13. preserves exact rule/content provenance
14. returns safe explicit failure outcomes
15. is deterministic
16. prepares Phase E without implementing it
17. passes local/hosted CI

# O — OBJECTIVES

## Architecture
Audit Phase C/B2 models, rule engine, content eligibility, exercise/recovery relationships, equipment, demand profiles, taxonomies, rule-set activation, provenance, tests/admin/CI. Write `docs/PHASE_D_PLAN.md` first.

Create framework-independent `packages/prescription-engine/`. No React/Next/Expo/HTTP dependencies in core logic.

## Request / Provenance
Typed request supports individual reference, training date/context, objective, duration, equipment, space/environment, supplied readiness, supplied recent load, supplied program phase, functional restrictions, safety facts, preferences, candidate scope and optional emphasis.

Do not calculate readiness/load/phase.

Generated prescription preserves prescription/engine IDs and versions, rule engine/rule set, exact rule versions, exact content versions, request/material-fact fingerprints and generated time. Avoid randomness; if any seeded mechanism is unavoidable, it must be deterministic/versioned.

## Objectives
Support at least:
`GENERAL_READINESS`, `STRENGTH`, `MUSCLE_DEVELOPMENT`, `RUNNING`, `RUCKING`, `HYBRID`, `TACTICAL_FITNESS`, `WORK_CAPACITY`, `MOBILITY`, `RECOVERY`, `PFT_PREPARATION`, `CFT_PREPARATION`, `CUSTOM`.

Military objectives are specialized, not defaults.

## Session Structure
Support sections such as:
`PREPARATION`, `WARM_UP`, `MOVEMENT_PREP`, `PRIMARY`, `SECONDARY`, `ACCESSORY`, `CONDITIONING`, `MOBILITY`, `COOLDOWN`, `RECOVERY`.

Not every session uses every section.

## Time Budget
Respect requested duration including setup/transition, work, rest, section budgets and buffer. Never fit a longer session by silently deleting mandatory components or violating minimum constraints. Fail safely when necessary.

## Candidate Pool
Production mode may use only production-eligible content. Test mode may use explicit isolated synthetic fixtures. Pass all candidates through Phase C. Blocked stays blocked.

## Deterministic Selection
Rank/select using Phase C eligibility, objective, movement/capability needs, supplied phase/load/readiness, equipment, environment, time, complexity, movement balance, recovery cost and preference only after higher priorities.

Same request/facts/candidate versions/rule set/engine version => same material result. Candidate input order must not change output.

No AI or uncontrolled exercise roulette.

## Movement Composition
Support session-level composition such as push/pull balance, squat/hinge/lunge exposure, trunk/bracing, locomotion where appropriate, and avoidance of unnecessary repeated high-demand patterns. Do not invent medical rules.

## Volume / Intensity / Rest
Volume model supports sets, reps, duration, distance, intervals, rounds, work/rest and total target volume as applicable.

Intensity may support RPE, percentage-based interfaces, externally supplied pace zone, load target, bodyweight, time/distance effort and EASY/MODERATE/HARD. Do not fabricate 1RM, thresholds or physiological metrics.

Rest depends on objective, section, exercise, complexity, intensity and time. Time pressure cannot violate higher-priority technical/safety minimums.

## Progression / Regression / Substitution
Consume explicit Phase B relationships. Do not invent undocumented progression chains.

Substitute deterministically for equipment, restriction, space/environment or supervision constraints using explicit eligible relationships or a documented safe matching mechanism. Never substitute blocked for blocked.

## Preparation / Conditioning / Recovery
Preparation relates to upcoming movement/demand/objective, not random stretches.

Support individual conditioning structures such as continuous, intervals, work/rest, rounds, distance/time. No group station logistics.

Running/rucking may use synthetic/abstract session structures from supplied facts, but no GPS, route planning, pace-zone calculation from nonexistent physiology, or full endurance analytics.

Eligible recovery/cooldown may be included. No medical treatment or clinical nutrition.

## Supplied Readiness / Load / Phase
Consume Phase C responses to supplied facts. GREEN/YELLOW/ORANGE/RED behavior must be rule-driven, not independently duplicated. RED may yield recovery-only or `NO_SAFE_PRESCRIPTION` according to rules.

Consume recent-load facts; do not calculate them. Consume program phase; do not create long-term programs.

## Preference
Preference is low priority/tie-breaking only. It cannot override safety, restrictions, policy, eligibility, readiness/load constraints or required session structure.

## Failure Outcomes
Support:
- NO_SAFE_PRESCRIPTION
- INSUFFICIENT_ELIGIBLE_CONTENT
- INSUFFICIENT_TIME
- REQUIRED_EQUIPMENT_UNAVAILABLE
- REQUIRED_FACT_UNKNOWN
- CONTENT_NOT_PRODUCTION_ELIGIBLE
- RULE_SET_UNAVAILABLE
- INVALID_REQUEST

Return safe reason codes/explanations.

## Explainability
Output explains objective, structure choice, selection rationale, important exclusions/modifications, supplied readiness/load effects, equipment/time effects, preference influence, substitutions, reason codes and exact content/rule versions.

Maintain full restricted internal trace plus concise public-safe rationale.

## Immutable History
Finalized/saved prescription preserves exact historical content/rule references. Later changes never rewrite history.

## Construction Invariants
Enforce internally:
- every selected candidate survived Phase C
- time totals consistent
- section totals valid
- no duplicate exercise unless intentionally allowed
- required section constraints satisfied
- exact versions referenced

This is not the independent Phase E validator.

## Synthetic Fixtures
Create enough clearly isolated synthetic approved content to exercise Phase D across movements/capabilities/equipment/relationships/recovery. Never alter real B2 approval states.

## Golden Scenarios
Create deterministic scenarios for at least:
1. 45-min general strength
2. 30-min no-equipment
3. 60-min muscle development
4. running focus allowed
5. running requested but blocked
6. ruck-focused synthetic
7. YELLOW modifies
8. ORANGE reduces/redirects
9. RED safe failure/recovery
10. equipment loss substitution
11. limited space
12. overhead restriction
13. jump/high-impact restriction
14. high recent lower-body load
15. technical movement unavailable without supervision
16. preference influences equal choices
17. preference cannot override block
18. insufficient time
19. no safe eligible content
20. unpublished real B2 candidate excluded
21. identical repeat deterministic
22. shuffled candidate order identical
23. historical versions preserved
24. objective-specific structures differ appropriately

## Admin / API
Add internal admin testing console for synthetic request context, test rule set, candidate pool, Phase C constraints, final prescription and internal trace/provenance. No consumer workout UI.

Secure service/API: server determines content eligibility and active production rule set; client cannot forge status/activation. Test mode requires authorized internal access.

Ordinary USER cannot access synthetic/test controls. Subscription tier does not equal engine admin authority.

## Security / Privacy
Minimize persisted sensitive facts, fingerprint where appropriate, redact generic logs, restrict internal traces, separate public-safe explanation from internal trace, validate input and preserve least privilege.

Audit privileged production-affecting prescription-engine configuration/test-fixture administration as appropriate. Normal prescription history/provenance is not the editorial audit log.

## Tests
Required:
- Phase C block authority cannot be bypassed
- production content gate
- synthetic isolation
- deterministic repeat/input-order independence
- objective/session structure
- time-budget compliance
- movement composition
- volume/intensity/rest bounds
- progression/regression/substitution
- readiness/load/phase consumed not calculated
- preference low priority
- all failure outcomes
- public-safe/internal explainability
- exact provenance
- immutable saved history
- construction invariants
- all 24+ golden scenarios
- admin/API authorization/forgery rejection
- all A/B/B2/C regressions

## Documentation
Create/update:
- docs/PHASE_D_PLAN.md
- docs/PRESCRIPTION_ENGINE.md
- docs/PRESCRIPTION_REQUEST.md
- docs/SESSION_STRUCTURE.md
- docs/VOLUME_INTENSITY_REST.md
- docs/SUBSTITUTIONS.md
- docs/PRESCRIPTION_EXPLAINABILITY.md
- docs/GOLDEN_PRESCRIPTION_SCENARIOS.md
- docs/PRESCRIPTION_PROVENANCE.md
- docs/SECURITY.md
- docs/PRIVACY_DATA_CLASSIFICATION.md
- docs/ARCHITECTURE.md
- docs/TESTING.md
- docs/CHANGELOG.md
- docs/PHASE_D_REPORT.md
- ADRs as needed

# A — ACTIONS & ACCEPTANCE
Execute:
1. audit C/B2
2. write D plan
3. create prescription-engine package
4. typed request/result
5. objectives/session structures
6. integrate Phase C
7. enforce production candidate boundary
8. deterministic ranking
9. session construction/time budget
10. volume/intensity/rest
11. movement composition
12. progression/regression/substitution
13. preparation/conditioning/recovery
14. failure outcomes
15. explainability/provenance
16. immutable saved representation
17. isolated synthetic fixtures
18. 24+ golden scenarios
19. internal admin console
20. secure API/service
21. tests
22. all previous regressions
23. clean migrations/seeds/validation
24. format/lint/typecheck/security/license/build/export/smoke
25. commit/push authorized GitHub repo/branch
26. actual hosted CI
27. fix D-scope failures without weakening C/content gates
28. docs/report
29. STOP before Phase E

# PHASE D ACCEPTANCE CRITERIA
D is COMPLETE only if:
- all previous phases pass
- framework-independent prescription engine exists
- Phase C cannot be bypassed
- production content eligibility server-enforced
- real pending B2 content remains non-prescribable
- synthetic fixtures isolated
- typed request/result works
- objective/session structures work
- time budget respected
- deterministic ranking works
- volume/intensity/rest works
- movement composition works
- explicit progression/regression/substitution works
- blocked candidates never reappear
- readiness/load/phase consumed, not calculated
- preference remains low priority
- explicit failure outcomes including NO_SAFE_PRESCRIPTION work
- explainability/public-safe rationale works
- exact provenance recorded
- saved history immutable/version-stable
- construction invariants work
- at least 24 golden scenarios pass
- shuffled input does not change material output
- no Phase E validator exists
- no COMMAND/Unit PT logic
- no consumer workout UI
- security/privacy passes
- regressions/builds/security/license checks pass
- hosted CI passes
- docs reflect reality

If any fails: `PHASE D = INCOMPLETE`.

# PROHIBITED
Do not override Phase C; prescribe blocked/unapproved content; promote B2 records; fabricate reviews; implement Phase E; generate long-term programs; calculate readiness/load; implement GPS, formations, Unit PT, Live PT, health integrations, billing, AI exercise selection, uncontrolled randomness; expose raw sensitive facts; weaken safety/content gates; or claim checks passed unless executed.

# REQUIRED FINAL REPORT
When complete, STOP and report:

## PHASE
Phase D — Deterministic Individual Prescription Engine

## STATUS
COMPLETE or INCOMPLETE

## ARCHITECTURE
Package boundaries and integration with Phase C.

## REQUEST / SESSION MODEL
Supported inputs/objectives/sections.

## CANDIDATE ELIGIBILITY
Production boundary and synthetic isolation.

## SELECTION / COMPOSITION
Deterministic ranking and movement/session composition.

## VOLUME / INTENSITY / REST
Implemented models and bounds.

## PROGRESSION / REGRESSION / SUBSTITUTION
Behavior and safeguards.

## GOLDEN SCENARIOS
Every scenario and result.

## FAILURE OUTCOMES
Counts/types and tested behavior.

## EXPLAINABILITY / PROVENANCE
Public-safe/internal traces and exact versions.

## IMMUTABLE HISTORY
Saved-prescription behavior.

## ADMIN / API
Internal testing surfaces and authorization.

## SECURITY / PRIVACY
Controls/gaps.

## DATABASE / FILES / ADRS
Migrations, files, ADRs.

## TESTS / RESULTS
Actual commands/results.

## BUILD RESULTS
Actual results.

## HOSTED CI
Provider/workflow/branch/commit/run/result.

## ACCEPTANCE CRITERIA
Every criterion PASS/FAIL with evidence.

## KNOWN ISSUES
Unresolved items.

## OPEN DECISIONS
Only genuine owner decisions.

## PHASE E READINESS
READY or NOT READY.

Then STOP. Do not begin Phase E.

# FINAL DIRECTIVE
Build the individual candidate-session constructor, while Phase C remains sovereign over safety and eligibility.

**Request → Phase C constraints → eligible pool → deterministic structure/selection/dosing → explainability/provenance → tests → hosted CI → report → STOP.**
