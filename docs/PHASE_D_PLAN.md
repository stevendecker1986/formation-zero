# Phase D implementation plan

Status: COMPLETE. Implementation, clean validation and hosted CI passed. Individual candidate-session construction only; no Phase E.

## Audited baseline

Clean main 5335342c6a0cb770fa63122befa328ecb40c5ca1. Phase C final hosted run 33939566121 passed with 70 tests. Existing framework-independent Phase C evaluator, strict fact schemas, deterministic priorities/effects, protected rule-set activation, immutable knowledge/reviews, transitive production eligibility and private evaluation provenance remain authoritative. B2 still has 100 exercise/30 recovery candidates and zero published corpus records. Migrations 001–006, branding and entitlement architecture are preserved.

## Gaps and implementation decisions

- Add framework-independent prescription-engine package. It invokes Phase C itself; it never accepts client-supplied eligibility or a forged Phase C result. Base candidates and proposed dosing snapshots must pass Phase C; a base block is never reconsidered as an allowed substitute/dose.
- Introduce versioned PRESCRIPTION_TEMPLATE editorial records and optional prescription metadata on exercise/recovery versions. Production structures/doses require published, reviewed, rights-eligible versions; no production training defaults or physiological thresholds are invented. Existing technical/safety/editorial/rights gates apply; official provenance retains POLICY requirements.
- Explicit dose options carry work/rest/setup/transition timing, minimum rest, volume and supplied intensity interfaces. Respect mandatory slots and preparation links, reserve buffer, use deterministic bounded search/ranking and only feasible dose options. Unsupported/ambiguous Phase C limit units fail safely unless explicitly defined in the reviewed template.
- Preserve Phase C score priority before composition/tie-break preferences. Honor explicit regression/progression/substitution edges; automatic alternatives without a requested source are selected by documented slot requirements, never invented progression chains.
- Test catalog contains isolated synthetic approved-state simulations, synthetic templates and rule fixtures; no real reviews or B2 state changes. Test API permits catalog IDs and supplied synthetic context, not forged fixture/status data. Production API loads active rules and exact published content/template versions server-side.
- Save immutable candidate prescriptions and exact historical references in a separate table. Facts stay transient; use keyed fingerprints, actor-only history, restricted internal trace and a separate public-safe rationale. No public consumer endpoint/UI or independent validator.
- Extend the internal admin console for request/candidate scope, Phase C constraints, prescription and trace inspection. Preserve existing roles/grants; subscriptions confer no editorial authority.

## Validation and completion

Create at least 24 golden scenarios and tests for all failures, time/volume/composition, relationship behavior, Phase C authority, privacy, immutable history and API forgery denial. Run prior regressions, real/clean migrations and seeds, scans/licenses, all builds/exports, built smoke and actual hosted CI. Report all 30 criteria with evidence and stop before Phase E.
