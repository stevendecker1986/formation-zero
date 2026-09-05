# ADR 0016: Independent prescription validation

Status: Accepted

## Decision

Create a framework-free validation package that does not depend on the Phase D package. It owns schemas tolerant enough to classify malformed artifacts, independent time/composition arithmetic, stable findings and deterministic result material. It may invoke Phase C with exact stored rules because Phase C remains authoritative over restrictions and safety.

Persist each exact Phase D construction input as an AES-256-GCM envelope and add a keyed final-artifact fingerprint. Store immutable versioned validation policies, activation history and validation results. The server selects policy and publication/rights evidence. Delivery reruns validation with current evidence and fails closed.

## Consequences

Builder assertions cannot prove their own validity. A second implementation adds maintenance cost, but shared bugs in construction and checking are less likely. Existing Phase D rows created before migration 008 have no sealed context and fail closed as `VALIDATION_INPUT_UNAVAILABLE`; history is preserved rather than rewritten.
