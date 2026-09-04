# Testing and validation

Run `npm ci`, `npm run db:start`, `npm run db:migrate`, `npm run db:seed`, then `npm run validate` from the root. `npm run validate` fails at the first nonzero check. Do not suppress tests or vulnerability failures.

`npm test` executes Node's test runner through tsx. Each integration harness creates a unique schema in a database whose name ends `_test`, migrates from empty, seeds, and closes/drops only its own generated schema. It uses PostgreSQL 18, not mocks or a memory SQL substitute. Test mail is captured in process memory and never sent. Production databases cannot satisfy the test-name guard.

Unit tests cover exact enums and schemas, the owner-approved 0/6/9 capability mapping, COMMAND inheritance, PERFORMANCE Unit PT denial, role/resource separation, legal gate rejection, conservative rights helper, config validation, forged inputs, and log allowlisting. API/DB integration covers registration/duplicates, verification/replay, credential failures, defaults, admin role enforcement, forged claims, immutable privileged audit, revocation/logout/expiry/reset, disabled accounts, CSRF/origin checks, throttling, data isolation and rollback. Additional security tests cover hardening and race/error paths.

`npm run smoke` starts the bundled API and built Next web/admin servers against an isolated test schema and exercises HTTP health, web account proxy and auth/admin enforcement. `npm run build` builds Next web/admin and the bundled API, then exports Android/iOS/web mobile bundles without credentials. `security:clients` checks built browser/mobile files for private configuration identifiers and supplied secret values. Expo doctor and the mobile permission check validate configuration; Android prebuild also permits inspecting the generated manifest. Native binary signing, device execution, and iOS compilation on Windows are not claimed.

`npm run ci:failure-probes` intentionally supplies bad lint/type/test/SQL inputs in an isolated directory/schema and asserts that each check returns nonzero. These expected failures make the probe command succeed only if detection works. They never edit the actual implementation or mark a failing production check successful.

Hosted CI lives in `.github/workflows/phase-a.yml` and uses PostgreSQL, a clean npm install, full validation, and failure probes. No remote exists initially, so hosted CI status is unverified until the project is pushed and a run succeeds. A local clean-source run is reported separately. See the final Phase A report for exact commands, failures fixed, and actual results.
