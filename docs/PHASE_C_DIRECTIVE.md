# FORMATION ZERO — CODEX RCGOA MASTER DIRECTIVE
## Phase C — Deterministic Rule Engine
### Authority: v1.0-PLAN + Amendment 001 + Completed A/B/B2
### Scope: PHASE C ONLY

# R — ROLE
Continue as Formation Zero's software, training-systems, safety-rule, provenance, security, testing, and documentation lead. A, Amendment 001, B and B2 are COMPLETE with hosted CI passing. Implement **Phase C only**. Do not begin Phase D.

Do not generate complete workouts, implement the Prescription Engine, calculate readiness/training load, implement programs, Unit PT logistics, or treat unapproved B2 content as production-prescribable.

# C — CONTEXT
Formation Zero is a universal human-performance platform. USMC human-performance doctrine is an important knowledge foundation, not the target-market boundary.

B2 contains 100 exercise and 30 recovery production-candidates, but they remain subject to lifecycle, review, rights, and publication gates. Phase C may use explicit synthetic test fixtures. Never silently promote INGESTED/PENDING content.

Canonical priority hierarchy, highest to lowest:
- P0 SAFETY
- P1 FUNCTIONAL_RESTRICTIONS
- P2 OFFICIAL_POLICY
- P3 EXERCISE_ELIGIBILITY
- P4 READINESS
- P5 RECOVERY_RECENT_LOAD
- P6 PROGRAM_PHASE
- P7 TRAINING_OBJECTIVE
- P8 MOVEMENT_BALANCE
- P9 EQUIPMENT_SPACE
- P10 FORMATION_LOGISTICS
- P11 USER_PREFERENCE
- P12 OPTIMIZATION

Lower priority never overrides higher priority.

The Rule Engine answers: **given facts and candidate content, what constraints, exclusions, requirements, modifications or preferences apply, and why?**

It does NOT answer: **what complete workout should be performed?**

`NO_SAFE_ELIGIBLE_OPTION` is a valid result. Never relax safety to force an answer.

# G — GOAL
Implement a versioned, deterministic, auditable, source-traceable Rule Engine that:
1. represents explicit rules declaratively
2. evaluates P0–P12 deterministically
3. supports hard blocks, requirements, modifications, eligibility, soft preferences and scoring
4. resolves conflicts predictably
5. emits stable reason codes
6. preserves rule provenance/version/effective dates
7. produces explainability traces
8. respects content production eligibility
9. supports golden scenarios
10. prevents lower-priority resurrection of blocked candidates
11. prepares Phase D without implementing it
12. passes local and hosted CI

# O — OBJECTIVES

## Architecture
Audit Phase B/B2 knowledge, lifecycle, publication, schemas, audit, APIs, tests, CI and ADRs. Write `docs/PHASE_C_PLAN.md` before major implementation.

Create a framework-independent package such as `packages/rule-engine/`. Core evaluation must not depend on React/Next/Expo/HTTP.

## Stable IDs / Versioning
Rules use permanent IDs like `FZ-RULE-000001`. Reason codes use stable codes like `FZ-RSN-RESTRICTION-RUNNING`. Never reuse IDs for unrelated meaning.

Rule versions support rule_id, version, status, priority, type, effective dates, provenance, citations, author/reviews, timestamps and supersession. Published versions are immutable. Synthetic rules are explicitly test-only.

## Rule Types
Support at least:
- HARD_BLOCK
- REQUIREMENT
- MODIFICATION
- ELIGIBILITY
- SOFT_PREFERENCE
- SCORE_ADJUSTMENT
- INFORMATIONAL

A HARD_BLOCK cannot be reversed by lower priority.

## Evaluation Context
Typed future-facing facts may include safety flags, functional restrictions, policy, candidate metadata, supplied readiness state, supplied recent-load facts, program phase, objective, movement exposure, equipment, space/environment, formation facts and preferences.

Phase C consumes facts; it does not calculate readiness/load or build programs.

Use explicit UNKNOWN/missing semantics where absence could be safety-relevant. Never casually interpret missing as false.

## Declarative Conditions
Support safe composable conditions: equals/not-equals, tag membership, numeric comparisons/ranges, AND/OR/NOT, exists/missing, content status, equipment availability, movement/capability, complexity, demand thresholds and restrictions.

Do not store arbitrary executable code in DB rules.

## Typed Effects
Support concepts such as:
- BLOCK_CANDIDATE
- REQUIRE_ATTRIBUTE
- EXCLUDE_TAG
- REQUIRE_TAG
- MODIFY_LIMIT
- CAP_INTENSITY
- CAP_COMPLEXITY
- REQUIRE_RECOVERY
- ADD_REASON
- SCORE_UP
- SCORE_DOWN
- FLAG_REVIEW
- NO_AUTOMATIC_PRESCRIPTION

No complete workout construction.

## Safety / Restrictions
Support rules for explicit excluded movement, pain/safety flags blocking progression, supplied RED readiness preventing strenuous automatic prescription, functional/provider restrictions outranking preferences, unsafe surface/environment exclusions, unavailable/unsafe equipment, supervision requirements, and no-safe-option outcomes.

Functional constraints may include running_allowed, jumping_allowed, overhead_allowed, loaded_carry_allowed, high_impact_allowed, deep_knee_flexion_allowed. These are constraints, not diagnoses.

## Policy
Support policy/version/effective-date/population applicability with exact provenance. Do not implement full PFT/CFT scoring.

## Candidate Eligibility
Consume Phase B exercise metadata including production eligibility, movement/capability, equipment, complexity, restrictions, environment and supervision. Determine constraints/eligibility only; do not select a workout.

## Future Interfaces
Accept externally supplied readiness `GREEN/YELLOW/ORANGE/RED` with reason facts; do not calculate readiness.

Accept future load facts for 24h/72h/7d/28d and dimensions such as running, rucking, impact, lower/upper body, high intensity, aerobic, anaerobic; do not calculate them.

Accept program phases such as Baseline, Foundation, Accumulation, Development, Intensification, Performance, Test Preparation, Deload, Recovery, Transition, Rebuild; do not implement programs.

Accept objectives such as General Readiness, Strength, Running, Ruck, Hybrid, Tactical Fitness, Work Capacity, Mobility, Recovery, PFT, CFT, Custom; do not build sessions.

Support movement-balance, equipment/space, and future formation facts without implementing selection/logistics.

Preferences remain P11. Optimization is P12 and may rank only otherwise eligible choices.

## Conflict Resolution
Deterministic rules:
1. higher priority wins
2. HARD_BLOCK irreversible by lower priority
3. same-priority conflict uses explicit documented tie-break
4. required UNKNOWN facts follow safe documented behavior
5. no random resolution
6. conflicts appear in explainability

Same input facts + candidates + rule-set version + knowledge version => same material output. Avoid uncontrolled randomness, clock dependence, unordered iteration and DB row-order dependence.

## Reason Codes / Explainability
Every block/exclusion/material modification emits stable reason codes with category, safe explanation, severity and rule reference.

Evaluation trace supports evaluation ID, engine/rule-set/knowledge versions, fact snapshot/hash, rules considered/matched, priorities, effects, overridden lower effects, final constraints, reason codes, blocked candidates, warnings and no-safe-option outcome.

Do not leak sensitive facts in public explanations or generic logs.

## Provenance / Audit
Evaluation provenance must serialize engine version, rule-set version, exact rule versions, content-version refs, input snapshot/hash, output/reasons and evaluated_at.

Audit rule creation/version/review/publish/supersede/retire, rule-set activation, priority changes and reason-code changes.

## Admin / Rule Sets
Extend admin for rules, versions, priorities, conditions, effects, provenance, reasons, reviews, lifecycle, synthetic fixtures and rule sets.

Rule sets are immutable/versioned and reference exact rule versions. Production activation is explicit/auditable. Test/staging sets never silently become production.

Preserve existing editorial permission model. Do not create subscription tiers.

## APIs
Secure admin rule/version/review/publish/rule-set/reason-code endpoints as appropriate. Provide a validated deterministic evaluation service/API. Draft rules never participate in production evaluation. Client cannot forge published/active status.

## Golden Scenarios
Create stable synthetic fixtures for at least:
1. no-running restriction + running preference
2. no-overhead restriction + overhead candidate
3. high soreness/load fact + demanding lower-body candidate
4. RED readiness + strenuous candidate
5. unavailable equipment
6. unsafe surface + jump/sprint
7. high-complexity movement without supervision
8. preference among otherwise eligible candidates
9. policy applicability by effective date
10. non-production-eligible candidate
11. same-priority conflict
12. no safe eligible option
13. repeated large candidate-set determinism
14. P12 optimization attempting to resurrect blocked candidate

## Initial Rule Corpus
Do NOT create the final production rule library. Create only enough rules to exercise all priority classes, conflicts, safety/content gates, golden scenarios, review/versioning and explainability. Rules requiring real professional approval remain pending. Synthetic rules are clearly test-only.

## Tests
Required:
- exact P0–P12 ordering
- lower cannot override higher
- hard block irreversible
- repeated evaluation identical
- input/rule DB order independence
- AND/OR/NOT, numeric/range, UNKNOWN, tags, equipment/status conditions
- all typed effects
- safety/restriction/readiness/environment/equipment/supervision/no-safe-option
- policy effective dates/version provenance
- unpublished candidate blocked in production
- synthetic fixture allowed only in test mode
- reason/explainability trace correctness and redaction
- immutable published rules/new version/supersede/retire
- exact rule-set references
- USER denied admin
- editorial/publisher/activation permissions
- client forgery rejected
- all A/B/B2 regressions

## Security / Privacy
Validate all inputs, minimize persisted sensitive facts, avoid health-adjacent values in generic logs, separate evaluation provenance from marketing analytics, preserve least privilege and prevent client rule/status forgery.

## Documentation
Create/update:
- docs/PHASE_C_PLAN.md
- docs/RULE_ENGINE.md
- docs/RULE_PRIORITY.md
- docs/RULE_CONDITIONS_EFFECTS.md
- docs/REASON_CODES.md
- docs/RULE_EXPLAINABILITY.md
- docs/GOLDEN_RULE_SCENARIOS.md
- docs/RULE_REVIEW_AND_VERSIONING.md
- docs/SECURITY.md
- docs/PRIVACY_DATA_CLASSIFICATION.md
- docs/ARCHITECTURE.md
- docs/TESTING.md
- docs/CHANGELOG.md
- docs/PHASE_C_REPORT.md
- ADRs as needed

# A — ACTIONS & ACCEPTANCE
Execute in order:
1. audit repo/B2 corpus
2. write Phase C plan
3. implement rule schemas/domain
4. implement central P0–P12 model
5. implement declarative conditions
6. implement typed effects
7. implement deterministic evaluator
8. implement conflict resolution
9. implement reason-code registry
10. implement explainability
11. implement rule/version/rule-set persistence
12. integrate existing lifecycle/review/publication controls
13. implement production-content eligibility boundary
14. implement admin rule management
15. implement secure APIs/service
16. create synthetic initial rules
17. create all golden scenarios
18. add tests
19. run all previous-phase regressions
20. run clean migrations/seeds/validation
21. run format/lint/typecheck/security/license/build/export/smoke
22. commit/push authorized GitHub branch/repo
23. run actual hosted CI
24. fix Phase C failures without weakening gates
25. update docs/report
26. STOP before Phase D

# PHASE C ACCEPTANCE CRITERIA
Phase C is COMPLETE only if:
- A/B/B2 and Amendment 001 remain passing
- framework-independent rule engine exists
- exact P0–P12 hierarchy centralized/tested
- declarative conditions and typed effects work
- hard blocks cannot be overridden by lower priority
- same-priority conflict behavior deterministic
- UNKNOWN facts handled safely
- same inputs/versions yield same material output
- stable reason codes emitted
- explainability trace works
- rule/evaluation provenance works
- published rule versions immutable
- rule sets versioned/exact
- production activation explicit/audited
- draft rules excluded from production
- unapproved B2 candidates excluded from production mode
- synthetic fixtures isolated to test mode
- all 14+ golden scenarios pass
- no complete workout generator exists
- no readiness/load calculation exists
- no Phase D logic exists
- admin/API authorization works
- sensitive facts are not leaked to generic logs
- all tests/builds/security/license checks pass
- hosted CI passes
- docs reflect reality

If any fails: `PHASE C = INCOMPLETE`.

# PROHIBITED
Do not begin Phase D; generate workouts; implement exercise/session selection; calculate readiness/load; implement programs, PFT/CFT scoring, formations, Unit PT, Live PT, GPS, health integrations, billing or AI; promote pending B2 content; fabricate professional reviews; weaken safety/content gates; use arbitrary DB-executable code; use randomness to resolve conflicts; expose sensitive facts; or claim checks passed unless executed.

# REQUIRED FINAL REPORT
When complete, STOP and report:

## PHASE
Phase C — Deterministic Rule Engine

## STATUS
COMPLETE or INCOMPLETE

## ARCHITECTURE
Rule-engine design/package boundaries.

## RULE MODEL
IDs, versions, types, conditions/effects, lifecycle.

## PRIORITY / CONFLICT RESOLUTION
P0–P12 behavior and deterministic tie-breaks.

## INITIAL RULE FIXTURES
Counts by priority/type/status; distinguish synthetic vs production.

## GOLDEN SCENARIOS
Every scenario and result.

## REASON CODES / EXPLAINABILITY
Implemented behavior.

## CONTENT ELIGIBILITY
How unapproved B2 content is prevented from production use.

## RULE SETS / VERSIONING
Immutability/activation/provenance.

## ADMIN / API
Implemented management/evaluation surfaces and authorization.

## SECURITY / PRIVACY
Controls and gaps.

## DATABASE / FILES / ADRS
Migrations, files, ADRs.

## TESTS / RESULTS
Actual commands and results.

## BUILD RESULTS
Actual results.

## HOSTED CI
Provider, workflow, branch, commit, run, actual result.

## ACCEPTANCE CRITERIA
Every criterion PASS/FAIL with evidence.

## KNOWN ISSUES
Unresolved items.

## OPEN DECISIONS
Only genuine owner decisions.

## PHASE D READINESS
READY or NOT READY.

Then STOP. Do not begin Phase D.

# FINAL DIRECTIVE
Build the decision machinery, not the workout generator.

**Facts → versioned rules → priority/conflict resolution → constraints/effects → reason codes → explainability → validation → CI → report → STOP.**
