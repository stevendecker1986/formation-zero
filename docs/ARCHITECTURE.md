# Formation Zero architecture

## Boundaries

`apps/web` and `apps/admin` are Next.js shells; `apps/mobile` is an Expo/React Native shell. `services/api` is an Express 5 TypeScript API with Better Auth and PostgreSQL. `services/workers` and `services/notifications` reserve documented directories only. PostgreSQL is authoritative; no SQLite or in-memory database substitutes are used.

`packages/domain` contains framework-independent exact enums and authorization concepts. `schemas` depends on domain and Zod. `entitlements` depends on domain and holds the owner-approved mapping. `config` validates server configuration, using schemas. `ui` supplies only shared React shell markup. None depends on an application. Clients import domain/UI; they never import server config or secrets. Runtime resolution of identity, role, subscription, and resource access is separate.

## Requests and accounts

Web account UI calls a same-origin allowlisted proxy, which forwards cookies to the API. The API generates request IDs, checks exact origins and JSON content type for mutations, applies headers, validates strict schemas, authenticates via Better Auth, resolves enabled status/roles/tier from PostgreSQL, and returns safe data. Admin HTML is constructed only after server-side `/api/v1/admin` authorization. Admin denial never renders privileged content. Admin and web must use the same public host behind path routing in deployment so host-only cookies can be shared; local ports on localhost share cookies.

Phase A account routes remain register/login/logout, reset request/reset, verification request/verification, account read/profile display-name update, admin authorization, version root, and health. Phase B adds authenticated knowledge routes described below. Better Auth's full generic HTTP router is not exposed. Native account login is not implemented: mobile is a bootable shell as specified.

## Persistence

Versioned SQL migrations cover Better Auth's schema plus minimal profiles, exact roles, user roles, subscription accounts/catalog, audit events, throttling, and consumed token hashes. Registration triggers create USER and BASE atomically with the user. No fitness, location, readiness, unit, rank, or formation tables exist. Authentication-library optional image/provider-token columns are constrained to NULL in Phase A, and session IP/user-agent tracking is disabled and database-constrained.

Migrations run within one transaction with an advisory lock and immutable checksums. Synthetic local/test seeds are repeatable. Tests get unique PostgreSQL schemas in a database ending `_test`; production databases cannot be selected accidentally. Runtime and migration credentials should be separate; `database/runtime-grants.sql` gives the deployment privilege template.

## Entitlements and rights

BASE has none of the nine future capabilities. PERFORMANCE has six individual capabilities; COMMAND inherits those plus Unit PT, Live PT, and formation analytics. This mapping was explicitly approved by the owner. No corresponding fitness features are implemented. `subscription_entitlements` is a seeded catalog, not a client-editable override store. The central resolver is authoritative and parity is tested. The legal-commercial gate is a literal false and configuration rejects true.

Phase A's publishability helper remains a necessary-condition helper. Phase B adds an independent server-owned CMS publication workflow around the same lifecycle/provenance/rights enums. Neither is legal permission.

## Material decisions

See `docs/adr/`. Existing account and entitlement architecture is preserved. Phase B2 and Phase C remain excluded.

## Post-Phase-A Amendment 001

Formation Zero is universal fitness and human-performance software. Marine Corps doctrine is a major knowledge source, not the audience boundary. COMMAND serves universal group training; military hierarchy is optional in future design. See PRODUCT_POSITIONING.md. Amendment 001 introduced no editorial schema; Phase B now implements separate authorship, qualification, review and rights records.

The existing UI workspace owns provisional cross-platform semantic tokens. Web/admin share CSS and Shell; native imports tokens only. Canonical artwork is retained in assets/brand with an approved-vector replacement contract. See DESIGN_SYSTEM.md and ADR 0009. Phase A runtime/security/entitlement architecture is unchanged.

## Phase B knowledge foundation

`packages/knowledge` defines strict version payloads and exact movement/capability taxonomies. `services/api/src/knowledge` provides authenticated `/api/v1/knowledge` routes. The Next admin CMS uses a same-origin allowlisted proxy and existing session cookies. PLATFORM_ADMIN manages separate editorial grants; consumer roles and subscriptions confer no editorial permissions.

Migration 004 creates permanent coded entities, immutable versions, typed FK links, taxonomy tags, append-only reviews, editorial grants and separate lifecycle state. Content does not enter ordinary profiles. All mutation/audit work shares one transaction; advisory locking serializes low-volume editorial changes, and expected revisions reject stale requests. Database triggers preserve payload/review/history immutability.

No public knowledge API, production corpus, actual media processing or training logic is present. See KNOWLEDGE_BASE.md, CONTENT_LIFECYCLE.md, ADMIN_CMS.md and ADRs 0010–0012. Supporting-record verification mapping is owner-approved and enforced by the server; append-only decisions and independent final approval remain required.
