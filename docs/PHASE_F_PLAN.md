# Phase F implementation plan

## Audited starting state

`main` was clean and synchronized at `21b87ec71458c7967f5c38b98d0a60c2b49ea3b0`. Phase D stores immutable actor-owned prescriptions. Phase E independently validates sealed inputs and exposes a fail-closed production delivery check. The knowledge routes require editorial grants, no production validation policy exists, the B2 corpus remains unpublished, and the consumer web/mobile clients contain no training flow. Authentication, database-backed tiers, origin controls, request limits, safe errors, no-store responses, immutable history triggers, and the full CI pipeline are already present.

## Implementation sequence

1. Add a pure execution package for strict schemas, deterministic transitions, timers, offline envelopes, and consumer-safe failure codes.
2. Add migration 009 for immutable workout snapshots, versioned current state, append-only state events, append-only actual-performance revisions, authorized substitutions, and idempotency records. Extend least-privilege runtime grants.
3. Add an authenticated consumer training router. Resolve identity and tier on the server, orchestrate Phase D → Phase E → delivery, preserve the production fail-closed path, and permit synthetic sessions only through an explicit non-production demo gate.
4. Implement ownership, optimistic concurrency, idempotent start/write/terminal operations, server-authorized relationship substitutions, material-new-restriction termination, private filtered history, and consumer-safe output projection.
5. Build accessible web and Expo individual-training experiences with overview/detail, empty-media handling, navigation, timers, pause/resume, actual recording, completion/abandonment, history, and bounded user-scoped offline support.
6. Add Phase F unit/API/race/privacy/accessibility/client-boundary tests, expand smoke and CI labels, update required documentation, then run migrations, complete regression, clean validation, scans, builds/exports, smoke, and hosted CI.

## Boundaries and decisions

- Normal production requests continue to use Phase D, Phase E, and the production delivery gate; absent policy/content prerequisites remain public-safe failures.
- Synthetic fixtures may run only when server configuration is not `PRODUCTION`, are visibly marked demo, and never pass the production delivery endpoint.
- Every workout retains an immutable server-authorized prescription and validation snapshot. Mutable execution state and append-only actual revisions are separate.
- The existing BASE/PERFORMANCE/COMMAND resolver remains authoritative. Individual execution is available to authenticated enabled accounts across all three existing tiers; no new tier or billing behavior is added.
- Offline clients may cache only an already-started consumer-safe snapshot and queue bounded idempotent actual/state writes. The server remains authoritative and rejects stale versions and unauthorized substitutions.
- No readiness, load, program-phase, medical-text interpretation, advanced analytics, formation, location, wearable, billing, or Phase G behavior will be added.
