# ADR 0017: Server-authorized consumer execution

## Status

Accepted for Phase F.

## Context

The consumer experience must execute a prescription without becoming an authority for constraints, construction, validation, delivery, content state, entitlements, readiness, load, or program phase. Execution must also retain the difference between the immutable prescribed artifact and the user's actual work.

## Decision

An authenticated server orchestration path resolves the account tier, asks Phase D to construct, asks Phase E to validate independently, applies the server delivery gate, and only then creates an immutable workout snapshot. Production requests fail closed when content, sealed validation context, active policy, validation freshness, or delivery eligibility is absent. A separate server-gated demo path may use the existing synthetic fixtures only outside `PRODUCTION`; demo records carry an explicit synthetic marker and cannot cross the production delivery path.

Clients receive a consumer-safe projection and may submit only strict execution commands. A deterministic server state machine, optimistic version, idempotency key, ownership predicate, and append-only events decide every mutation. Actual performance is stored as append-only revisions linked to prescribed line identity. Substitutions are selected from server-authorized prescription relationships and require a replacement validated artifact. New material restrictions never trigger local adaptation; the server records the event and terminates the affected session safely.

Offline support is limited to an already-authorized active snapshot and a bounded queue of idempotent commands. Cached records are user-scoped, exclude restricted validation/rule traces, expire, and are cleared on logout or account change. Reconnection does not elevate authority; conflicts require a fresh server state.

## Consequences

The UI cannot forge runnable status, PASS/WARN, entitlements, substitutions, or prescribed values. Historical prescriptions and validations remain unchanged. Users can honestly record skips, differences, completion, and abandonment while production remains unavailable until separately authorized content and validation-policy prerequisites exist.
