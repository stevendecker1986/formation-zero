# Phase B security supplement

The baseline remains [SECURITY.md](../SECURITY.md). Knowledge APIs reuse enabled-account authentication, exact-origin JSON mutation checks, safe errors, bounded bodies, parameterized SQL, request IDs and HttpOnly cookies. All knowledge reads require an editorial grant or PLATFORM_ADMIN; no public draft/review/audit endpoint exists. Separate grants never derive from subscription or professional credentials.

Version payloads, relationships and review decisions are immutable. Server-owned publication checks revalidate reviews, rights, source verification, authorship and version/revision. Actor/state/advisory locks prevent conflicting editorial writes. Audit failure rolls back the write. Database deployment grants are in `database/runtime-grants.sql`; runtime is not the migration owner. Locators are inert and no untrusted URL is fetched. React text escaping is used; no HTML content renderer or code execution is provided.

Required tests include auth denial/forgery, credential redaction, immutable database triggers, review expiry/revocation, rights and source blocking, concurrency and audit rollback. Supporting-record gates are owner-approved in ADR 0012 and remain server-owned. Production content and externally verified permissions are not fixtures and require later controlled review.

## Phase C rule evaluation controls

Rule conditions/effects are strict data schemas with allowlisted paths and bounded complexity; no executable code or URL fetching. Rule/version/reason/set management reuses existing editorial gates. Only an explicitly granted PUBLISHER can activate a published non-synthetic set. Production evaluation resolves status, rules and candidate eligibility on the server, rechecks transitive references and media, and fails closed on stale or unapproved content. Test fixtures cannot activate in production.

Facts are transient. Evaluation provenance is separated from generic audit and marketing, uses a domain-separated keyed fingerprint, and can be read only by its evaluating actor with current editorial access. Generic logs retain the existing allowlist and never receive facts or evaluation output. Immutable evaluation/activation tables have SELECT/INSERT-only runtime grants. Real-data retention policy remains a production-launch decision; controlled tests use synthetic facts. See ADR 0014 and RULE_EXPLAINABILITY.md.

## Phase D

Phase D: internal editorial authorization is required for fixture access, construction and actor-only history. Server loads active production rules/eligibility; request envelopes reject forged states/rules/identity. Parameterized queries, bounded schemas/search, no-store proxy and existing CSRF protections remain. Immutable prescriptions permit runtime SELECT/INSERT only. Test fixtures are fixed code with no administration endpoint; template changes use existing audited editorial lifecycle. No real corpus state is promoted.
