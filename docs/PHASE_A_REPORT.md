## PHASE

Phase A — Foundation

## STATUS

**INCOMPLETE — Phase A = INCOMPLETE.**

All executed local checks passed. The unsatisfied acceptance item is **A18 / “CI passes”**: this repository has no Git remote and no hosted CI run. The supplied GitHub Actions workflow must pass from an authorized remote clean checkout before Phase A can be declared COMPLETE. A local clean-source run is evidence of local reproducibility, not a fabricated hosted CI result.

No Phase B work was started.

## INITIAL REPOSITORY STATE

The workspace contained only an uncommitted Git repository on `master`, with no commits, remote, tracked files, applications, dependencies, database, auth, tests, CI, environment configuration, docs or ADRs. No applicable AGENTS.md existed initially. The complete directive was read first, then the audit/requirement comparison/implementation plan was recorded before implementation. Nothing compatible needed replacement.

Host: Windows x64; Node 22.23.2 / npm 10.9.8. PostgreSQL, psql, Docker, Java/adb and Xcode were not available on PATH. A real project-local PostgreSQL 18.4 server was installed for development/testing. Restricted sandbox execution initially prevented network access and Node user lookup; approved elevated execution permitted installation and actual validation.

The authoritative document is preserved byte-for-byte in `docs/PHASE_A_DIRECTIVE.md`; its SHA-256 matches the supplied file: `B348F1140A48C3CF57677ACB2AF178B20E274753656211F2D94C8A86CE59735A`.

## ARCHITECTURE IMPLEMENTED

npm TypeScript monorepo; Next.js 16.3.4 web and protected admin shells; Expo SDK 57 / React Native 0.86.3 mobile shell; Express 5 API; Better Auth 1.7.2; PostgreSQL 18.4 with transactional checksummed SQL migrations. Strict shared domain/schema/config/entitlement packages and minimal React UI. Worker/notification directories are documented reservations, not speculative services.

Web account forms use a restricted same-origin server proxy. Admin uses `/admin` and obtains permission from the API on each server render. Mobile contains a foundation shell only. There are no future fitness endpoints or engines.

## FILES CREATED

101 relevant source/config/documentation files. Paths are repository-relative in this inventory:

```text
.env.example
.gitattributes
.github/workflows/phase-a.yml
.gitignore
.prettierignore
.prettierrc.json
CHANGELOG.md
DEPLOYMENT.md
DEVELOPMENT.md
PRIVACY_DATA_CLASSIFICATION.md
README.md
SECURITY.md
TESTING.md
apps/admin/AGENTS.md
apps/admin/CLAUDE.md
apps/admin/app/layout.tsx
apps/admin/app/page.tsx
apps/admin/next-env.d.ts
apps/admin/next.config.ts
apps/admin/package.json
apps/admin/tsconfig.json
apps/mobile/App.tsx
apps/mobile/app.json
apps/mobile/index.ts
apps/mobile/package.json
apps/mobile/tsconfig.json
apps/web/AGENTS.md
apps/web/CLAUDE.md
apps/web/app/account/page.tsx
apps/web/app/api/account/[...path]/route.ts
apps/web/app/layout.tsx
apps/web/app/page.tsx
apps/web/next-env.d.ts
apps/web/next.config.ts
apps/web/package.json
apps/web/tsconfig.json
database/migrate.ts
database/migrations/001_auth.sql
database/migrations/002_foundation.sql
database/migrations/003_account_hardening.sql
database/runtime-grants.sql
database/seeds/seed.ts
docs/ARCHITECTURE.md
docs/DEPENDENCY_LICENSES.json
docs/DEPENDENCY_LICENSING.md
docs/OPEN_DECISIONS.md
docs/PHASE_A_DIRECTIVE.md
docs/PHASE_A_REPORT.md
docs/REPOSITORY_AUDIT.md
docs/THIRD_PARTY_NOTICES.txt
docs/adr/0001-monorepo-clients.md
docs/adr/0002-api-database.md
docs/adr/0003-authentication.md
docs/adr/0004-authorization-entitlements.md
docs/adr/0005-audit.md
docs/adr/0006-configuration-privacy.md
docs/adr/0007-testing-ci.md
docs/adr/0008-provenance-rights.md
eslint.config.mjs
package-lock.json
package.json
packages/config/package.json
packages/config/src/index.ts
packages/domain/package.json
packages/domain/src/index.ts
packages/entitlements/package.json
packages/entitlements/src/index.ts
packages/schemas/package.json
packages/schemas/src/index.ts
packages/ui/package.json
packages/ui/src/index.tsx
scripts/clean-validation.ts
scripts/client-secrets.ts
scripts/database-local.ts
scripts/dev-smoke.ts
scripts/failure-probes.ts
scripts/generate-auth-migration.ts
scripts/licenses.ts
scripts/maintenance.ts
scripts/mobile-permissions.ts
scripts/next.mjs
scripts/scan-secrets.ts
scripts/smoke.ts
scripts/source-files.ts
services/api/package.json
services/api/src/app.ts
services/api/src/audit.ts
services/api/src/auth.ts
services/api/src/authorization.ts
services/api/src/db.ts
services/api/src/logging.ts
services/api/src/mail.ts
services/api/src/start.ts
services/notifications/README.md
services/workers/README.md
tests/api.test.ts
tests/foundations.test.ts
tests/helpers.ts
tests/security.test.ts
tsconfig.json
tsup.config.ts
```

Next dev generated the two AGENTS.md/CLAUDE.md pairs and Next type-reference files; these were inspected and retained. Generated, ignored local artifacts include `.env`, `.local/database-password`, PostgreSQL data, npm dependencies, Next/Expo build output, generated Android native files, temporary test artifacts and `validation-artifacts/` evidence. They are not intended for Git.

## FILES MODIFIED

No pre-existing project files were modified: there were none. The original Git metadata and supplied external directive were preserved. Files above were iteratively refined during implementation.

## DATABASE MIGRATIONS

| Migration                 | Purpose                                                                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 001_auth.sql              | Reviewed SQL generated from pinned Better Auth: users, identities, sessions, verification and library rate limits with indexes.                                                        |
| 002_foundation.sql        | Exact role/tier types; profiles; user roles; subscription accounts/catalog; atomic USER/BASE account defaults; append-oriented audit; HMAC throttle and consumed-token infrastructure. |
| 003_account_hardening.sql | Default enabled status; NULL constraints on unused images/tracking/provider tokens; serialized enabled-account check on session creation.                                              |

Migrations use a PostgreSQL advisory transaction lock, SHA-256 history checks and rollback on error. Seeds create disabled, credential-free synthetic tier fixtures plus a synthetic audit event, and reject STAGING/PRODUCTION. A separate runtime-grants template is supplied; hosted runtime provisioning was not performed. No fitness/health/GPS/formation schema exists.

## ADRS

| ADR  | Decision                                                                                                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------------- |
| 0001 | npm workspace boundaries, Next web/admin, Expo mobile.                                                                      |
| 0002 | Express API, parameterized PostgreSQL, versioned SQL, real local/test PostgreSQL.                                           |
| 0003 | Better Auth, limited public auth surface, required verification, revocable sessions, one-time guards, private account mail. |
| 0004 | Independent identity/role/tier/resource resolution; owner-approved centralized mapping; closed commercial gate.             |
| 0005 | Transactional privileged audit, append-only controls, trusted schema-owner boundary.                                        |
| 0006 | Validated private config, safe logging, ACCOUNT-only data and NULL-constrained optional library fields.                     |
| 0007 | Real-database tests, clean local validation, CI/failure probes and truthful hosted-CI limitation.                           |
| 0008 | Exact provenance/rights/status foundations and conservative helper without CMS/publishing.                                  |

## SECURITY / PRIVACY

Implemented strict schemas, parameterized access, safe structured errors/request IDs, allowlisted structured logging, exact-origin JSON mutations, CORS/CSRF protections, API headers, browser headers, signed HttpOnly SameSite cookies, Secure deployed cookies, database throttling, disabled-account checks, session revocation, and immutable privileged audit. No client-authoritative role/tier claims.

Only ACCOUNT/profile and authentication infrastructure data exist. No rank/unit/billet, fitness, readiness, health, GPS or raw payment information is collected. No sensitive mobile permissions are requested; generated Android manifest explicitly removes all named sensitive permissions plus overlay/vibration and disables backup. No credentials are bundled in the 47 inspected public artifact files.

Secrets/config fail closed. Local private material is ignored by Git; no secrets or any other files were committed. Source scanning and npm audit passed, with zero reported dependency vulnerabilities at validation time. License inventory/notice controls are active.

Operational limitations are explicit in SECURITY.md: Windows inherited ACLs; OneDrive synchronization independent of Git ignore; development-only local credentials; trusted database owner; production SMTP/TLS/secret-manager/runtime-login provisioning still external; sensitive library session material requires encrypted storage/backups and rotation on compromise. Mail delivery failures produce sanitized operational errors while public responses stay generic; there is no durable mail retry queue.

## AUTHENTICATION / AUTHORIZATION

Registration, duplicate prevention with identical generic public responses, email verification, login, protected account/profile access, logout, verification resend, password-reset request/reset, expiry and replay denial are implemented and tested. Better Auth uses salted scrypt, a 12–128 character password policy, 30-minute verification/reset tokens and 24-hour database sessions refreshed at most hourly. Reset/logout/disable revoke sessions as applicable. Disabled accounts cannot authenticate or access protected routes.

The only initial roles are USER, LEADER, COACH_FFI, FORMATION_ADMIN and PLATFORM_ADMIN. Default USER is assigned transactionally. USER is denied admin; PLATFORM_ADMIN is allowed. Internal privileged mutations recheck an enabled PLATFORM_ADMIN and write an audit event in the same transaction. No public role/tier mutation endpoint or bootstrap backdoor exists. Future resource permission currently denies all resources.

## SUBSCRIPTIONS / ENTITLEMENTS

Exactly BASE (free), PERFORMANCE (paid individual foundation), COMMAND (paid leader foundation). BASE is the account default. The owner explicitly approved the mapping during implementation:

- BASE: none of the nine future capabilities.
- PERFORMANCE: full library, adaptive programming, readiness engine, advanced progress, run tracking, ruck tracking.
- COMMAND: all PERFORMANCE capabilities plus Unit PT, Live PT and formation analytics.

One immutable resolver owns this mapping; the PostgreSQL catalog is tested for parity. These are capability foundations only, with no corresponding fitness feature. COMMAND grants no role or formation/resource access.

LEGAL_COMMERCIAL_GATE_APPROVED is **false**, defaults false in configuration, and configuration rejects true. Automated activation-blocking tests pass. No real billing is active.

## TESTS

25 executed unit/integration subtests cover exact enums/runtime schemas; approved mappings/inheritance/denial; legal gate; UNKNOWN rights; malformed config without leaks; forged payloads; safe logs; clean migration/seed/isolation; health/version/validation; registration/duplicates; hashing; verification/expiry/concurrent replay; login; protected routes; cookies; admin/forgery denial; privileged queryable audit; audit immutability/rollback; logout/session expiry/reset revocation; disabled accounts; shared throttling across instances; CSRF/origin protection; data-minimization constraints; safe database failures.

Separate HTTP smoke checks exercise the built API and Next shells, account proxy/cookies, and server-rendered admin denial/allow. Development smoke starts the API, Next shells and Expo Metro. Failure probes intentionally reject invalid lint/type/test/migration inputs, including migration rollback.

## TEST RESULTS

Actual executed results:

| Command / check                                                                              | Result                                                                                               |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| npm ci --no-fund in independent temporary source copy                                        | PASS, exit 0; 739 installed packages, zero audit vulnerabilities.                                    |
| npm run db:start                                                                             | PASS; real PostgreSQL 18.4 bound to loopback 55432.                                                  |
| npm run db:migrate / npm run db:seed                                                         | PASS, exit 0; all three migrations and synthetic fixtures.                                           |
| npm exec -- tsx database/migrate.ts then database/seeds/seed.ts in a new disposable database | PASS, exit 0 for both.                                                                               |
| npm test                                                                                     | PASS: 25 tests, 0 failures, 0 skipped; also passed in clean environment.                             |
| npm run security:secrets                                                                     | PASS, source credential patterns/public-env boundary.                                                |
| npm run security:dependencies                                                                | PASS, npm audit low threshold, 0 vulnerabilities.                                                    |
| npm run security:clients                                                                     | PASS, 47 public browser/mobile files.                                                                |
| npm run licenses                                                                             | PASS, 828 locked entries; conditional license obligations documented.                                |
| npm run doctor -w @formation-zero/mobile                                                     | PASS, 21/21 checks.                                                                                  |
| npm exec -w @formation-zero/mobile -- expo prebuild --platform android --no-install          | PASS; actual generated manifest inspected.                                                           |
| npm run mobile:permissions                                                                   | PASS.                                                                                                |
| npm run smoke                                                                                | PASS, built API/web/admin/account-proxy/auth/authorization HTTP checks.                              |
| npm run smoke:dev                                                                            | PASS, API/Next/Expo development startup.                                                             |
| npm run ci:failure-probes                                                                    | PASS: intentional lint exit 1, type exit 2, test exit 1; invalid migration rejected and rolled back. |
| npm run db:maintenance                                                                       | PASS, exit 0; expired auth infrastructure cleanup.                                                   |
| npm run validate:clean                                                                       | PASS, all five stages exited 0; independent source directory and brand-new disposable PostgreSQL DB. |

Evidence: `validation-artifacts/clean-results.json`, `clean-install.log`, `clean-migrate.log`, `clean-seed.log`, `clean-validate.log`, `clean-failure-probes.log`. The clean runner retains the source copy and logs, and drops only its generated disposable DB. No test output contains credentials/tokens.

Failures encountered and fixed, rather than concealed: sandbox Node/network restrictions; ES2022 typing of findLast (updated server type library to ES2023); invalid tsup CLI flag (typed tsup config); vulnerable Nodemailer/esbuild/UUID resolutions (patched versions); duplicate/incompatible React Native peers and their transitive advisories (Expo-aligned override); initially unreviewed license expressions (documented explicit review); mutually exclusive Expo smoke CLI flags (corrected and rerun). No failing test or scan was suppressed.

## BUILD RESULTS

| Command                                        | Actual result                                                                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| npm run format:check                           | PASS.                                                                                                             |
| npm run lint                                   | PASS, max warnings 0.                                                                                             |
| npm run typecheck                              | PASS, root plus all app workspaces in strict mode.                                                                |
| npm run build -w @formation-zero/web           | PASS, Next production build.                                                                                      |
| npm run build -w @formation-zero/admin         | PASS, Next protected shell build.                                                                                 |
| npm run build:api                              | PASS, ESM bundle, executed by production smoke.                                                                   |
| npm run validate -w @formation-zero/mobile     | PASS, Android/iOS Hermes and web bundles exported without credentials.                                            |
| npm run validate                               | PASS, complete local fail-fast pipeline; repeated in clean source/database environment.                           |
| Hosted GitHub Actions                          | **NOT RUN / FAIL acceptance evidence**: no remote exists. Workflow is supplied; no hosted result is claimed.      |
| Signed mobile binary / native device execution | NOT RUN: no SDK/device/signing environment supplied; strongest available credential-free validation above passed. |

A local run is not a hosted CI run. The clean snapshot was followed by a development-smoke script, type-only exports, generated Next guidance and documentation refinements; final formatting/type/lint/security checks also passed for those changes.

## ACCEPTANCE CRITERIA

Every action acceptance item:

| Item                       | Status | Evidence                                                                                                                                                                                             |
| -------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1 Repository audit        | PASS   | Pre-implementation audit and plan preserved.                                                                                                                                                         |
| A2 Workspace               | PASS   | Fresh npm ci; working root scripts; acyclic shared package dependency direction.                                                                                                                     |
| A3 TypeScript              | PASS   | Strict final workspace typecheck passed; no explicit any or strictness suppression in maintained source.                                                                                             |
| A4 Web                     | PASS   | Next dev and production HTTP smoke, build, lint, typecheck and account proxy tests passed.                                                                                                           |
| A5 Mobile                  | PASS   | Expo exports for Android/iOS/web, Metro dev startup, doctor 21/21 and native manifest inspection passed. No JDK/Android SDK/Xcode/device is available; signed/native binary compilation not claimed. |
| A6 Admin                   | PASS   | Server-side role checks tested at API and rendered built shell.                                                                                                                                      |
| A7 API                     | PASS   | Health, version, request IDs, invalid input, safe errors, anonymous denial and authenticated account access passed.                                                                                  |
| A8 Database                | PASS   | Clean real PostgreSQL database migrated/seeded; isolation, transaction rollback and checksums implemented/tested.                                                                                    |
| A9 Authentication          | PASS   | Required authentication/revocation/expiry/replay tests passed; mail captured locally/tested without sending to third parties.                                                                        |
| A10 Roles                  | PASS   | Exact role schema, USER default, server ownership, forgery denial.                                                                                                                                   |
| A11 Entitlements           | PASS   | Approved tier mapping, inheritance, denial, catalog parity, and forgery tests.                                                                                                                       |
| A12 Commercial gate        | PASS   | Automated activation-blocking test; true config rejected.                                                                                                                                            |
| A13 Audit                  | PASS   | Queryable privileged event and append-only behavior tested.                                                                                                                                          |
| A14 Foundational types     | PASS   | Exact domain/runtime schema tests and UNKNOWN-rights denial.                                                                                                                                         |
| A15 Config/secrets         | PASS   | Invalid/missing config rejected; private generated files ignored; source and client-artifact scans passed.                                                                                           |
| A16 Security               | PASS   | Throttling, authorization, validation, safe logging, dependency/secret checks and docs verified.                                                                                                     |
| A17 Testing                | PASS   | 25/25 tests passed in independent clean environment.                                                                                                                                                 |
| A18 CI                     | FAIL   | Local CI-equivalent pipeline and deliberate lint/type/test/migration failure probes passed; hosted clean-checkout CI cannot run without a remote.                                                    |
| A19 License control        | PASS   | 828-entry inventory, upstream notices and conditional copyleft obligations reviewed.                                                                                                                 |
| A20 ADRs/docs              | PASS   | All required documents, eight ADRs and exact local startup commands supplied and exercised.                                                                                                          |
| A21 Final clean validation | PASS   | Independent source copy, npm ci, new PostgreSQL DB, migrations, seed, static/security/license tests, builds and API/auth/admin smoke all exited 0.                                                   |

Every final Phase A acceptance criterion:

| Criterion                                              | Status | Evidence                                                                                                                                                                              |
| ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository audit completed                             | PASS   | docs/REPOSITORY_AUDIT.md was created before implementation; initial Git repository was empty.                                                                                         |
| Monorepo/workspace coherent                            | PASS   | Fresh npm ci, strict workspace typecheck, package imports, and all shell builds passed.                                                                                               |
| Web/mobile/admin/API foundations boot or validate      | PASS   | Production builds, built API/web/admin smoke, development smoke, Android/iOS/web Expo exports, and Expo doctor 21/21 passed.                                                          |
| PostgreSQL authoritative; migrations reproducible      | PASS   | Actual PostgreSQL 18.4; new disposable database → three migrations → seed → startup; schema-isolated tests and migration rerun passed.                                                |
| Authentication works                                   | PASS   | Register/duplicate rejection, verification/replay/expiry, login failure/success, logout, password reset and revocation tested on PostgreSQL.                                          |
| Role model works                                       | PASS   | Exact five roles, default USER, forged claims denied; USER denied admin and PLATFORM_ADMIN allowed.                                                                                   |
| BASE/PERFORMANCE/COMMAND model works                   | PASS   | Exact three tiers, BASE default, owner-approved 0/6/9 mapping and PostgreSQL catalog parity tested.                                                                                   |
| Centralized entitlements work                          | PASS   | One immutable resolver; COMMAND inherits PERFORMANCE; PERFORMANCE denied Unit PT; forgery tests passed.                                                                               |
| Role/tier/resource-permission concepts remain separate | PASS   | Independent resolution; COMMAND USER remains denied admin; resource permission foundation always denies.                                                                              |
| Commercial legal gate defaults false                   | PASS   | Literal false, config default false, config rejects true, commercial activation function tested to throw.                                                                             |
| No real billing active                                 | PASS   | No payment integration, billing endpoint, card data or activation path exists.                                                                                                        |
| Audit framework works                                  | PASS   | Privileged changes create queryable actor/action/entity/time/reason/metadata/request records; UPDATE/DELETE/TRUNCATE denied; audit failure rolls back change.                         |
| Shared domain/schema/config foundations exist          | PASS   | Strict typed packages consumed across workspaces; final typecheck and enum/config tests passed.                                                                                       |
| Content-status/provenance/rights foundations exist     | PASS   | Exact enums and runtime schemas tested; no CMS or source ingestion implemented.                                                                                                       |
| UNKNOWN rights is non-publishable                      | PASS   | Helper returns false for UNKNOWN across every content status; automated tests passed.                                                                                                 |
| Environment validation works                           | PASS   | Missing/invalid values, malformed private inputs, production transport requirements and gate true rejected in tests.                                                                  |
| Secrets are not committed/exposed                      | PASS   | No commits exist; Git ignores private generated files; source secret scan passed; 47 browser/mobile artifact files passed secret-boundary scan.                                       |
| Security baseline implemented/documented               | PASS   | Origin/CSRF checks, strict validation, shared throttling, safe errors/logs, session controls, database hardening and security/privacy docs; npm audit reports zero vulnerabilities.   |
| Critical tests pass                                    | PASS   | 25 tests passed, zero failed/skipped; repeated successfully in independent clean source/database environment.                                                                         |
| CI passes                                              | FAIL   | GitHub Actions workflow is configured; equivalent local clean pipeline and failure probes passed. No remote or hosted workflow run exists, so clean-checkout hosted CI is unverified. |
| Dependency licensing reviewed                          | PASS   | 828 locked dependency entries reviewed; installed notices retained; no unknown/incompatible license unresolved for Phase A use. MPL/LGPL redistribution obligations are explicit.     |
| ADRs/docs reflect reality                              | PASS   | Eight ADRs; required architecture/security/privacy/development/testing/deployment/changelog docs, preserved directive, complete inventory and truthful evidence.                      |
| No unauthorized Phase B+ functionality                 | PASS   | No fitness/policy/medical engine, CMS, formations, GPS, health integration, real billing, book/QR, AI, social or ads.                                                                 |

## KNOWN ISSUES

1. **Blocking completion:** hosted clean-checkout CI is unverified. Configure an authorized remote and obtain a green supplied workflow run. A18 and the final CI criterion remain FAIL.
2. SMTP delivery to real external infrastructure, HTTPS deployment, runtime DB-role provisioning, device execution and native signing were not exercised. Local/in-memory mail, actual PostgreSQL and credential-free mobile checks passed.
3. The current proxy conservatively shares an IP throttle bucket; multi-user deployment needs trusted proxy/rate-limiter provisioning. Do not trust arbitrary forwarding headers.
4. Local credentials/data reside in a OneDrive workspace; Git ignore is not a cloud-sync control. Use unsynced/managed secret storage for real data. Audit retention and deployment admin bootstrap require explicit operational approval before real launch.
5. MPL/LGPL dependencies have documented redistribution obligations. This foundation does not authorize commercial launch or binary redistribution. ESLint 9 emits an upstream deprecation notice, but the executed audit reports no vulnerabilities.
6. Account mail has no durable retry queue. Delivery failures emit `mail.failed`; restore service and resend. No production email reliability claim is made.

## OPEN DECISIONS

No unresolved product-level Phase A decision. The only ambiguity encountered—the nine-capability tier mapping—was explicitly approved by the owner and recorded in ADR 0004 / OPEN_DECISIONS.md. Deployment access/operational prerequisites and hosted CI are external execution requirements, not invented product decisions. Commercial launch approval remains absent.

## PHASE B READINESS

The local foundation is implemented and validated. **Phase B must not begin** until Phase A's outstanding hosted-CI acceptance item is satisfied and further work is separately authorized. No Phase B functionality was implemented.
