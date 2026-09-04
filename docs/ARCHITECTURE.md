# Phase A architecture

## Boundaries

`apps/web` and `apps/admin` are Next.js shells; `apps/mobile` is an Expo/React Native shell. `services/api` is an Express 5 TypeScript API with Better Auth and PostgreSQL. `services/workers` and `services/notifications` reserve documented directories only. PostgreSQL is authoritative; no SQLite or in-memory database substitutes are used.

`packages/domain` contains framework-independent exact enums and authorization concepts. `schemas` depends on domain and Zod. `entitlements` depends on domain and holds the owner-approved mapping. `config` validates server configuration, using schemas. `ui` supplies only shared React shell markup. None depends on an application. Clients import domain/UI; they never import server config or secrets. Runtime resolution of identity, role, subscription, and resource access is separate.

## Requests and accounts

Web account UI calls a same-origin allowlisted proxy, which forwards cookies to the API. The API generates request IDs, checks exact origins and JSON content type for mutations, applies headers, validates strict schemas, authenticates via Better Auth, resolves enabled status/roles/tier from PostgreSQL, and returns safe data. Admin HTML is constructed only after server-side `/api/v1/admin` authorization. Admin denial never renders privileged content. Admin and web must use the same public host behind path routing in deployment so host-only cookies can be shared; local ports on localhost share cookies.

Only register/login/logout, reset request/reset, verification request/verification, account read/profile display-name update, admin authorization, version root, and health routes exist. Better Auth's full generic HTTP router is not exposed. Native account login is not implemented: mobile is a bootable shell as specified.

## Persistence

Versioned SQL migrations cover Better Auth's schema plus minimal profiles, exact roles, user roles, subscription accounts/catalog, audit events, throttling, and consumed token hashes. Registration triggers create USER and BASE atomically with the user. No fitness, location, readiness, unit, rank, or formation tables exist. Authentication-library optional image/provider-token columns are constrained to NULL in Phase A, and session IP/user-agent tracking is disabled and database-constrained.

Migrations run within one transaction with an advisory lock and immutable checksums. Synthetic local/test seeds are repeatable. Tests get unique PostgreSQL schemas in a database ending `_test`; production databases cannot be selected accidentally. Runtime and migration credentials should be separate; `database/runtime-grants.sql` gives the deployment privilege template.

## Entitlements and rights

BASE has none of the nine future capabilities. PERFORMANCE has six individual capabilities; COMMAND inherits those plus Unit PT, Live PT, and formation analytics. This mapping was explicitly approved by the owner. No corresponding fitness features are implemented. `subscription_entitlements` is a seeded catalog, not a client-editable override store. The central resolver is authoritative and parity is tested. The legal-commercial gate is a literal false and configuration rejects true.

Content enums are foundations only. Publishability denies UNKNOWN and unresolved third-party copyright, unapproved states, and absent verified rights evidence. It is a necessary-condition helper, not legal permission or a CMS publication workflow.

## Material decisions

See `docs/adr/`. No existing architecture was replaced. Scope deviations are limited to technical implementation choices described there. Phase B remains excluded.

## Post-Phase-A Amendment 001

Formation Zero is universal fitness and human-performance software. Marine Corps doctrine is a major knowledge source, not the audience boundary. COMMAND serves universal group training; military hierarchy is optional in future design. See PRODUCT_POSITIONING.md for future authorship, qualification, technical/safety/specialty review and rights separation. No editorial schema or affiliation fields are added.

The existing UI workspace now owns provisional cross-platform semantic tokens. Web/admin share CSS and Shell; native imports tokens only. Canonical artwork is retained in assets/brand with an approved-vector replacement contract. See DESIGN_SYSTEM.md and ADR 0009. Phase A runtime/security/entitlement architecture is unchanged; Phase B has not begun.
