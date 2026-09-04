# ADR 0010 — Immutable typed knowledge versions

Status: accepted technical decision, Phase B.

Use kb-prefixed entities plus immutable JSONB version envelopes with strict kind-specific Zod schemas. Normalize exact-version relationships and taxonomy tags into foreign-key-backed tables. Keep lifecycle state separate from immutable payloads and append review/audit history. The alternative of fourteen similar version/history table families adds repetitive migration/API machinery without improving the Phase B boundaries. JSONB sacrifices some database-level field typing; critical score, lineage, enum, attachment and identity invariants therefore also have constraints/triggers, and all API payloads use strict schemas.

Use permanent global sequence-backed FZ codes and internal UUID version IDs. Every edit creates a new version, including drafts. No delete endpoint is provided; retirement retains references/history. Keep exact references stable across supersession.

Serialize low-volume editorial transactions with a transaction-scoped advisory lock, in addition to actor/entity/state locks and expected revisions. This prioritizes publication/revocation correctness over concurrent editorial throughput; revisit only with measured scale and equivalent race tests. Migration/runtime separation and immutable triggers remain required. No training/health data is added.
