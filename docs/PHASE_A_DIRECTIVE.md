# FORMATION ZERO — CODEX RCGOA MASTER DIRECTIVE
## Phase A — Foundation | Authority: Formation Zero v1.0-PLAN

# R — ROLE
You are the Principal Software Architect, Staff Full-Stack Engineer, Security Engineer, Database Architect, DevOps Engineer, and Technical Documentation Lead for **Formation Zero**. Implement this directive faithfully. Do not redesign the product or invent fitness doctrine, USMC policy, medical guidance, subscription tiers, permissions, privacy/safety behavior, or commercial rules. Low-level choices may use the simplest secure production-grade option; record material decisions as ADRs.

**Implement PHASE A ONLY. Do not proceed to Phase B.** Document product-level ambiguities instead of guessing.

# C — CONTEXT

**FORMATION ZERO — Readiness Starts Here.** It is an independent tactical fitness, recovery, readiness, and formation-training platform. Long-term scope: web + iOS/Android, admin CMS, book integration, source-traceable exercise/recovery knowledge bases, assessments, policy-aware PFT/CFT, adaptive programming, running, rucking, GPS, training load, readiness, Unit PT generation, formations, offline Live PT, subscriptions, and optional health/wearables.

It is **not** an official USMC/DoD product. Never add EGA, Marine Corps Seal, USMC branding, rank/unit insignia, Marine slogans, fake official marks, or implied endorsement.

Mission: develop individual capability and formation readiness through assessment, training, recovery, adaptation, and leader planning.

Individual loop: `ASSESS → PLAN → TRAIN → MEASURE → RECOVER → ADAPT → REASSESS`
Leader loop: `ASSESS → PLAN → ORGANIZE → BRIEF → EXECUTE → RECOVER → AAR → ADAPT`
Pillars: `ASSESS / TRAIN / RECOVER / PERFORM / LEAD`

## Subscription model
Exactly:
- `BASE` — free
- `PERFORMANCE` — paid individual
- `COMMAND` — paid leader; includes PERFORMANCE

Never add tiers. `ROLE != SUBSCRIPTION != RESOURCE_PERMISSION`. COMMAND does not automatically grant formation access.

Future BASE/PERFORMANCE/COMMAND fitness features are **not Phase A**.

## Privacy
Future domains: `ACCOUNT`, `FITNESS`, `SENSITIVE_HEALTH_ADJACENT`, `LOCATION`, `FORMATION`. Private health/readiness data must never automatically become leader-visible. Phase A collects only minimal ACCOUNT/profile data.

## Safety
Future priority: Safety → restrictions → official policy → exercise eligibility → readiness → recovery/load → program phase → objective → movement balance → equipment/space → formation logistics → preference → optimization. Phase A does not implement this engine.

## AI
AI is never the authoritative fitness engine. Future AI may parse/search/explain/summarize but never bypass approved content, safety, restrictions, policy, or deterministic validation. No AI in Phase A.

## Content/IP
**CONTENT IS NOT CODE.** Future fitness content/policies/rules/media are structured/versioned data.

Provenance: `OFFICIAL`, `OFFICIAL_DERIVED`, `FZ_DERIVED`, `FZ_ORIGINAL`, `SUPPORTING_EVIDENCE`.

Rights: `FORMATION_ZERO_ORIGINAL`, `US_GOVERNMENT_WORK_VERIFIED`, `PUBLIC_DOMAIN_VERIFIED`, `LICENSED`, `PERMISSION_GRANTED`, `THIRD_PARTY_COPYRIGHT`, `UNKNOWN`. UNKNOWN is non-publishable.

Statuses: `DISCOVERED`, `INGESTED`, `SOURCE_VERIFIED`, `TECHNICALLY_REVIEWED`, `SAFETY_REVIEWED`, `EDITORIALLY_REVIEWED`, `APPROVED`, `PUBLISHED`, `SUPERSEDED`, `RETIRED`.

Define foundations only; no Phase B CMS. Do not copy source text wholesale or assume `.mil` media is commercially reusable.

Formation Zero is fitness software, not diagnosis/treatment/PT/rehab and never overrides provider restrictions.

Commercial launch is unauthorized. Implement `LEGAL_COMMERCIAL_GATE_APPROVED=false` (or semantic equivalent). No real billing while false.

# G — GOAL
Deliver a secure, testable, documented Phase A monorepo ready for Phase B. Establish repository/tooling, bootable web/mobile/admin/API, PostgreSQL/migrations, authentication, minimal accounts, roles, three tiers, centralized entitlements, authorization primitives, commercial gate, audit framework, shared types/schemas, provenance/rights/status foundations, environment/secrets, security, tests/CI, ADRs, and docs. Stop when Phase A passes.

# O — OBJECTIVES

1. **Audit first.** Inspect existing apps/packages/frameworks/package manager/workspace/DB/auth/API/tests/CI/env/docs/ADRs/security/deployment. Preserve compatible useful work; document conflicts and material deviations.

2. **Monorepo.** Prefer:
```text
formation-zero/
├── apps/{web,mobile,admin}
├── packages/{domain,schemas,entitlements,ui,config}
├── services/{api,workers,notifications}
├── database/{migrations,seeds}
├── docs/adr/
└── tests/
```
Future training/logistics/validation/policy/analytics engines are not implemented now.

3. **Technology.** Prefer TypeScript, React, Next.js, React Native/Expo, PostgreSQL, runtime schemas, server API. Preserve a compatible existing stack. Material deviations require ADRs.

4. **Apps.** Web: bootable/buildable shell. Mobile: bootable shell, no GPS/health/notification permissions. Admin: protected shell, PLATFORM_ADMIN allowed and USER denied server-side. No full product UI.

5. **API.** TypeScript API with `/health`, versioned `/api/v1`, runtime validation, safe structured errors, request IDs, redacted structured logging, auth middleware, authorization primitives, tests. Do not fake future endpoints.

6. **PostgreSQL.** Authoritative DB with connections, migrations, dev/test setup, transactions, health check, safe ORM/query layer, seeds/docs. Empty DB → migrate → seed → start must work.

7. **Phase A schema only.** At minimum consider `users`, `user_profiles`, `auth_identities`, `roles`, `user_roles`, `subscription_accounts`, `subscription_entitlements`, `audit_events`. No speculative fitness/health/GPS/program/formation tables. Minimal user/profile only; no rank/unit/billet/fitness data.

8. **Authentication.** Secure email/password register/login/logout, protected route, revocable expiring sessions/tokens, disabled-account handling, password reset, email verification. Proven libraries, secure hashing, one-time expiring tokens, throttling, no account enumeration, no secrets/tokens in logs.

9. **Roles.** Exactly initial roles: `USER`, `LEADER`, `COACH_FFI`, `FORMATION_ADMIN`, `PLATFORM_ADMIN`. Default USER. No self-promotion or client-authoritative role claims.

10. **Tiers/entitlements.** `BASE`, `PERFORMANCE`, `COMMAND`; default BASE. Central capabilities should anticipate `CAN_USE_FULL_LIBRARY`, `CAN_USE_ADAPTIVE_PROGRAMMING`, `CAN_USE_READINESS_ENGINE`, `CAN_USE_ADVANCED_PROGRESS`, `CAN_USE_RUN_TRACKING`, `CAN_USE_RUCK_TRACKING`, `CAN_USE_UNIT_PT`, `CAN_USE_LIVE_PT`, `CAN_USE_FORMATION_ANALYTICS`. Use centralized resolver; COMMAND inherits PERFORMANCE; server authoritative.

11. **Commercial gate.** Default false; no real billing. Provider-neutral subscription data is fine; never store raw card data.

12. **Authorization.** Separately resolve identity, role, subscription entitlement, future resource permission.

13. **Audit.** Append-oriented server events with actor/action/entity/timestamp/reason/metadata/request ID. Audit privileged role/entitlement changes and account enable/disable if implemented.

14. **Shared packages.** `domain` framework-independent; `schemas` runtime validation; `entitlements` centralized capability mapping; `config` validated config; minimal `ui` only if useful.

15. **Stable enums.** Implement exact role/tier/status/provenance/rights/environment primitives. Add publishability helper; `UNKNOWN` rights => false.

16. **Environment/secrets.** Support `LOCAL`, `TEST`, `STAGING`, `PRODUCTION`; fail fast; `.env.example`; no secrets in repo/client/log/snapshots/public env.

17. **Security.** Secure auth/session, server authorization, validation, rate limits for auth/reset/verification, secure headers/CORS/CSRF/cookies as applicable, parameterized DB access, least privilege where practical, secret/dependency scanning, redacted logs. Document threat assumptions.

18. **Logging.** Structured timestamp/level/service/request ID/event/safe user ID/sanitized metadata. Never log credentials, tokens, secrets, payment data, or future health/GPS data.

19. **Tests.** Unit/integration/API/DB/authorization. Required: registration success/duplicate reject; login success/failure; protected route; logout; USER denied admin; PLATFORM_ADMIN allowed; role forgery rejected; BASE/PERFORMANCE/COMMAND mappings; COMMAND inherits PERFORMANCE; PERFORMANCE denied Unit PT; entitlement forgery rejected; commercial gate false; privileged audit event; invalid env failure; clean migration/seed; invalid API payload; safe errors.

20. **CI.** Install, format, lint, typecheck, tests, migration validation, dependency/security scan, license check where practical, build. Never suppress failures.

21. **Dependency licensing.** Maintain package/version/license/commercial compatibility/notice inventory. Avoid unclear commercial licenses.

22. **ADRs.** Use `docs/adr/` for material decisions: monorepo, clients, backend/API, DB/ORM/migrations, auth/session, role-vs-entitlement, entitlement model, audit, config, testing/CI as applicable.

23. **Docs.** Maintain `README.md`, `docs/ARCHITECTURE.md`, `SECURITY.md`, `PRIVACY_DATA_CLASSIFICATION.md`, `DEVELOPMENT.md`, `TESTING.md`, `DEPLOYMENT.md`, `CHANGELOG.md`, and ADRs. Describe reality; label planned features.

24. **Seed/dev experience.** Synthetic users/roles/tier fixtures only. No real people/USMC fitness content. Document exact install/DB/migrate/seed/run/test/lint/typecheck/build commands; provide bootstrap script if useful.

25. **Explicit exclusions.** No source/exercise ingestion, recovery library, CMS, training/rule/prescription/validation engines, readiness, training load, PFT/CFT/BCP calculations, programs, GPS, formations, Unit PT, Live PT, HealthKit/Health Connect/Garmin, real billing, book QR, AI, social/community, ads.

# A — ACTIONS & ACCEPTANCE

Execute in order. Do not proceed past Phase A.

## A1 Repository audit
Inspect first; record initial state, preserved architecture, conflicts, and planned Phase A changes.
**Accept:** audit exists before destructive work.

## A2 Workspace
Create/normalize monorepo and package boundaries.
**Accept:** clean install, root scripts, shared packages consumable, no unnecessary circular dependencies.

## A3 TypeScript
Strict shared TypeScript config.
**Accept:** workspace typecheck PASS without broad `any` or disabled strictness.

## A4 Web
Bootable/buildable web shell.
**Accept:** dev/prod build, lint, typecheck, tests PASS.

## A5 Mobile
Bootable mobile shell with no sensitive permissions.
**Accept:** strongest credential-free build/validation PASS; shared packages work; no secrets bundled.

## A6 Admin
Protected admin shell.
**Accept:** USER denied, PLATFORM_ADMIN allowed, server-side enforcement tested.

## A7 API
Health/versioning/validation/errors/request IDs/logging/auth/authz foundation.
**Accept:** health PASS; invalid payload safely rejected; anonymous protected request denied; authenticated request allowed.

## A8 Database
Reproducible migrations and seed.
**Accept:** empty DB → migrate → seed → startup PASS; test DB isolation works.

## A9 Authentication
Register/login/logout/reset/verification foundation.
**Accept:** all required auth tests PASS; sessions revocable; no enumeration; secure hashing/session behavior documented.

## A10 Roles
Stable role model.
**Accept:** default USER; privilege server-controlled; role forgery tests PASS.

## A11 Entitlements
Three tiers plus centralized capability resolver.
**Accept:** inheritance/denial/forgery tests PASS; no scattered plan-name checks.

## A12 Commercial gate
Implement legal-commercial gate false.
**Accept:** automated test proves commercial activation blocked.

## A13 Audit
Append-oriented audit framework.
**Accept:** privileged change produces queryable audit event with actor/action/entity/time/request context.

## A14 Foundational types
Implement roles/tiers/entitlements/status/provenance/rights/environment plus runtime schemas.
**Accept:** type/schema tests PASS; UNKNOWN rights non-publishable.

## A15 Config/secrets
Validated environment system and `.env.example`.
**Accept:** invalid/missing config fails fast; no committed secrets; public/server config separated.

## A16 Security
Apply Phase A baseline.
**Accept:** rate limits, authorization, validation, secure logging/scans configured; security docs updated.

## A17 Testing
Critical automated suite.
**Accept:** all Phase A tests PASS from clean environment.

## A18 CI
Automated pipeline.
**Accept:** clean checkout CI PASS; representative lint/type/test/migration failures correctly fail CI.

## A19 License control
Dependency license inventory.
**Accept:** no known incompatible/unknown production dependency license unresolved.

## A20 ADRs/docs
Truthful architecture/security/privacy/development/testing/deployment/changelog docs and ADRs.
**Accept:** a new developer can understand architecture and start locally from docs.

## A21 Final clean validation
From clean checkout/environment run, as applicable:
1. install
2. DB start/setup
3. migrations
4. seed
5. typecheck
6. lint
7. tests
8. builds
9. API health
10. auth smoke test
11. admin authorization smoke test

**Accept:** all applicable checks PASS.

# PHASE A ACCEPTANCE CRITERIA

Phase A is complete only when ALL are true:

- Repository audit completed.
- Monorepo/workspace coherent.
- Web/mobile/admin/API foundations boot or validate.
- PostgreSQL authoritative; migrations reproducible.
- Authentication works.
- Role model works.
- BASE/PERFORMANCE/COMMAND model works.
- Centralized entitlements work.
- Role/tier/resource-permission concepts remain separate.
- Commercial legal gate defaults false.
- No real billing active.
- Audit framework works.
- Shared domain/schema/config foundations exist.
- Content-status/provenance/rights foundations exist.
- UNKNOWN rights is non-publishable.
- Environment validation works.
- Secrets are not committed/exposed.
- Security baseline is implemented/documented.
- Critical tests pass.
- CI passes.
- Dependency licensing reviewed.
- ADRs/docs reflect reality.
- No Phase B+ functionality was implemented without authorization.

If any criterion fails: **PHASE A = INCOMPLETE**.

# PROHIBITED CODEX BEHAVIOR

Do not:
- proceed beyond Phase A
- invent product/training/USMC/medical behavior
- add subscription tiers
- conflate role/subscription/resource permission
- trust client role/entitlement claims
- activate real billing
- hard-code future fitness content in UI
- add USMC marks/branding
- ingest unknown-rights media
- implement AI fitness authority
- create speculative health/GPS fields
- weaken security to pass tests
- suppress CI failures
- commit secrets
- silently replace useful architecture
- fabricate test/build results
- claim PASS unless the command actually passed

# CHANGE CONTROL

This directive is authoritative. If a conflict/ambiguity materially affects product behavior, privacy, security, legal controls, or future training architecture:
1. stop that specific decision;
2. document the issue;
3. identify affected files/spec areas;
4. propose the smallest compliant options;
5. do not invent the product decision.

Low-level technical decisions may proceed when they do not alter product behavior.

# DEFINITION OF DONE

A Phase A feature is done only when implementation exists, types validate, relevant tests pass, authorization/privacy/security implications are handled, audit requirements are satisfied where applicable, documentation is updated, and acceptance criteria pass.

# REQUIRED PHASE A REPORT

When Phase A is complete, STOP. Do not begin Phase B.

Return a report with exactly these sections:

## PHASE
`Phase A — Foundation`

## STATUS
`COMPLETE` or `INCOMPLETE`

## INITIAL REPOSITORY STATE
What existed before implementation.

## ARCHITECTURE IMPLEMENTED
Concise summary.

## FILES CREATED
Complete relevant inventory.

## FILES MODIFIED
Complete relevant inventory.

## DATABASE MIGRATIONS
Names and purposes.

## ADRS
List each ADR and decision.

## SECURITY / PRIVACY
Controls implemented and known gaps.

## AUTHENTICATION / AUTHORIZATION
What is working.

## SUBSCRIPTIONS / ENTITLEMENTS
Confirm BASE/PERFORMANCE/COMMAND and legal commercial gate status.

## TESTS
Tests added.

## TEST RESULTS
Report actual commands and results. Never invent results.

## BUILD RESULTS
Actual build/typecheck/lint/CI results.

## ACCEPTANCE CRITERIA
For every Phase A criterion: PASS / FAIL with evidence.

## KNOWN ISSUES
Anything unresolved.

## OPEN DECISIONS
Only product-level ambiguities requiring owner input.

## PHASE B READINESS
State whether the repository is ready for Phase B. Do **not** start Phase B.

# FINAL DIRECTIVE

Implement **Formation Zero Phase A — Foundation** exactly within the boundaries above.

Priorities:
1. correctness
2. security
3. privacy
4. maintainability
5. reproducibility
6. truthful documentation
7. future extensibility

Do not optimize for flashy UI. Do not rush into fitness features. Do not build the entire product in one pass.

**Inspect → plan → implement Phase A → test → document → report → STOP.**
