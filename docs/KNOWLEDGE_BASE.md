# Phase B knowledge foundation

Phase B implements editorial infrastructure, not a production corpus or a training engine. Phase B2 population and Phase C rules remain excluded. All shipped seed content is explicitly synthetic. No image, source document or courseware is downloaded by these features.

`packages/knowledge` owns strict, framework-independent Zod schemas and the directive's exact taxonomies. `services/api/src/knowledge` owns authenticated operations and publication gates. PostgreSQL migration `004_knowledge.sql` adds isolated `kb_*` tables; account profiles, roles, subscriptions and entitlement mappings are unchanged.

## Storage and identity

Each `kb_entities` row has an internal UUID, immutable kind and permanent FZ code. One non-cycling PostgreSQL sequence supplies the numeric suffix, padded to at least six digits. Sequence gaps are intentional; codes are unique globally and never recycled. Prefixes: SRC source, SRV source version, SEC section, CIT citation, AUT author, QLF qualification, REV reviewer, EX exercise, EQP equipment, RCV recovery, RST restriction, MRQ media requirement, AST asset, RGT rights.

`kb_versions` holds immutable kind-specific payloads, version number, creator and previous-version UUID. Every edit creates another version, including edits before publication. Version UUIDs are the reference contract; FZ codes identify the entity across versions. `kb_links` stores foreign-key-backed exact-version references with target-kind validation; `kb_tags` links exact movement/capability values. Payload and attachment history cannot be updated, deleted or truncated. Lifecycle projection lives in `kb_states`; review decisions live in append-only `kb_reviews`. Historical reads include version history, inbound/outbound links and supersession metadata.

All API operations run transactionally. Editorial requests share one transaction-scoped advisory lock, a deliberate throughput tradeoff for low-volume foundation workflows. Publication cannot race an editorial rights change, grant revocation or review decision. Entity/state locks and expected version/revision checks reject stale writes. Audit insertion failure rolls back the content change. See ADR 0010.

## Exercise and recovery fields

Exercise payloads contain name/aliases/summary/original instruction text, primary and secondary movement/capability tags, equipment references, complexity, all 14 demand fields, six formation suitability scores, individual suitability, scaling, restrictions, media requirement/assets, author, citations, provenance, rights and effective date. Publication date/status come from the version state. Complexity is 1 SIMPLE, 2 BASIC, 3 INTERMEDIATE, 4 ADVANCED, 5 EXPERT/SUPERVISED. Demand scores are integer 0–5; suitability is 0 inappropriate, 1 poor, 2 constrained, 3 suitable, 4 highly suitable, 5 ideal. These are stored metadata, never computed prescriptions or access controls.

Variants are distinct versioned exercise entities with optional parent-version reference and FOUNDATION/READY/PERFORM/ALTERNATE_EQUIPMENT/LOW_IMPACT/LIMITED_SPACE/NO_EQUIPMENT/OTHER classification. Directional relationship entries are explicit; no inverse or inferred relationship is created. Restrictions store category, body region, severity/eligibility text and exact source-section/reviewer references. They do not diagnose or execute medical rules.

Equipment is organization-neutral and records portable/fixed/none and quantity semantics. Recovery stores purpose, typical use, demand/intensity, duration guidance, equipment, body area, authorship/provenance/rights and relationships to exercises, exact movement/capability values, training type, body area or stress category. No scheduling, adaptation, readiness or fitness logic consumes these values.

## Migration and operations

Run `npm run db:migrate`, then `npm run db:seed` only against LOCAL/TEST. Migrations 001–003 retain their original checksums. Migration 004 is transactional and adds the knowledge schema plus KNOWLEDGE audit entity type; it does not remove audit immutability. Seed uses an advisory lock and a synthetic marker for repeatability; it does not enable accounts or grant editorial permissions. Never run this fixture seed in production.

Use separate migration and runtime credentials. Apply `database/runtime-grants.sql` after migrations; runtime does not own tables or have DDL privileges. An UPDATE(id) privilege on entities permits PostgreSQL row locking only; the immutable trigger rejects actual updates. Back up and restore-test before deployment. Prefer a forward migration for fixes. A pre-migration backup can be restored only before accepting dependent writes; dropping the schema is not a rollback for published history.

Supporting verification policy remains pending owner approval; see ADR 0012. Do not treat a locally tested provisional gate as an approved publication policy.
