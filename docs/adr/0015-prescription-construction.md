# ADR 0015 — Reviewed individual candidate-session construction

Status: accepted for Phase D implementation. No Phase E authorization.

## Context

Phase C provides safety/eligibility and immutable editorial provenance. B2 has no approved production prescription profiles. Hardcoding production workouts or promoting corpus records would invent unauthorized training behavior.

## Decision

Use a framework-independent deterministic constructor that always invokes Phase C. Add PRESCRIPTION_TEMPLATE to the existing editorial lifecycle and optional versioned prescription metadata to exercise/recovery versions. Four review types, applicable POLICY review and independent final approval remain prerequisites. Templates/doses are reviewed data; no production defaults or automatic publication.

Test catalog code is isolated and synthetic. Production loads active rules and exact currently eligible content on the server. Both the base candidate and proposed intensity snapshot must survive C. Explicit relationships stay exact-version references. Missing required facts/profiles/limit units fail safely. Reviewed WORK_SECONDS unit declarations prevent guessed interpretations of Phase C exposure caps.

Use bounded deterministic slot matching, explicit work/rest/setup/transition budgets and preparation links. Never trim required rest/components or resurrect a blocked base. No duplicate content versions. No independent validation engine or consumer session UI.

Persist separate immutable prescriptions with actor-only access, keyed fingerprints, exact provenance and restricted trace. Normal history is not editorial audit. Template changes use existing audited version/review/publication actions; fixture code changes use Git/CI review. No fixture mutation endpoint is introduced.

## Consequences

An installation without approved rules/templates/content returns failures. This is intentional and does not authorize invented training defaults. Clinical review remains external and real. Search is bounded; resource exhaustion fails explicitly. Historical traces are sensitive derived data requiring restricted access and future retention decisions. The production service is internal in Phase D; a later phase must separately authorize a consumer flow.
