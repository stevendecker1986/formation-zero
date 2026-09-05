# Phase B validation supplement

Baseline instructions: [TESTING.md](../TESTING.md). `npm test` discovers all existing and Phase B tests. `tests/knowledge.test.ts` uses actual PostgreSQL and HTTP sessions for source/citation/version, author/qualification redaction, reviewer grants and decisions, equipment/exercise/recovery, still metadata, rights/publication, supersession/retirement, exact taxonomies, constraints, concurrency, search, origin/access boundaries and transactional audit failure. Fixtures are synthetic and schema-isolated.

`npm run smoke` starts production API, web and admin builds. Phase B assertions cover denied ordinary users, explicit grants, SSR workspace access, actual Next proxy creation/read, foreign-origin rejection and anonymous denial. `npm run smoke:dev` retains baseline development-client checks. There is no mocked claim of professional review or content correctness.

`npm run validate:clean` installs a fresh source-only checkout into a new directory, creates a disposable PostgreSQL database, runs all migrations and synthetic seed, full format/lint/typecheck/tests/security/dependency/licenses/builds/Expo validation and smoke, plus failure probes. Logs live in ignored `validation-artifacts/`. The existing GitHub workflow **Phase A foundation** now labels its validation step for Phase A, Amendment 001 and Phase B; no prior check is removed or weakened. The report records actual run evidence only.

## Phase C checks

Run npm test for all prior regressions plus tests/rule-engine.test.ts (16 golden scenarios and core semantics) and tests/rule-api.test.ts (real PostgreSQL lifecycle/activation/production-boundary/privacy). The runtime-grant regression includes the new immutable tables. npm run validate:clean performs fresh install/migrations/seeds/B2 import/full validation and failure probes. npm run smoke additionally exercises the built CMS rule evaluation proxy and denies unauthorized production activation. Hosted Phase A foundation runs the same required validation chain; no checks are skipped for Phase C. See PHASE_C_REPORT.md for executed results.

## Phase D

Phase D adds tests/prescription-engine.test.ts (24 golden scenarios plus bounds/failures/relationships/privacy), prescription-api.test.ts and production/history subtests in rule-api.test.ts. Runtime grants and built CMS smoke include prescriptions. npm run validate:clean performs source-only npm ci, fresh migrations/seeds/corpus, all validation and failure probes. Existing Phase A foundation hosted workflow runs the same checks including D. See PHASE_D_REPORT.md for actual execution evidence.

## Phase E

Phase E adds independent PASS/WARN/REJECT, deterministic, constrained/recovery/substitution/shuffle golden cases and the exact numbered 30-mutation adversarial suite. PostgreSQL/API tests cover encrypted context, client forgery, production policy authority, actual B2 rejection, immutable results, actor isolation, positive delivery and delivery invalidation after supersession. The full prior suite, clean source-only validation, builds, scans, license checks, smoke and hosted workflow remain required.
