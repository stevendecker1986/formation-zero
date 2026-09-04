# Phase B security supplement

The baseline remains [SECURITY.md](../SECURITY.md). Knowledge APIs reuse enabled-account authentication, exact-origin JSON mutation checks, safe errors, bounded bodies, parameterized SQL, request IDs and HttpOnly cookies. All knowledge reads require an editorial grant or PLATFORM_ADMIN; no public draft/review/audit endpoint exists. Separate grants never derive from subscription or professional credentials.

Version payloads, relationships and review decisions are immutable. Server-owned publication checks revalidate reviews, rights, source verification, authorship and version/revision. Actor/state/advisory locks prevent conflicting editorial writes. Audit failure rolls back the write. Database deployment grants are in `database/runtime-grants.sql`; runtime is not the migration owner. Locators are inert and no untrusted URL is fetched. React text escaping is used; no HTML content renderer or code execution is provided.

Required tests include auth denial/forgery, credential redaction, immutable database triggers, review expiry/revocation, rights and source blocking, concurrency and audit rollback. Supporting-record gate policy remains pending ADR 0012. Production content and externally verified permissions are not fixtures and require later controlled review.
