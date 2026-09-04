# Development

Use Node 22.22+ (22.x), npm 10+, and an ordinary non-root user. `npm ci` installs workspaces and real local PostgreSQL binaries through embedded-postgres. Windows x64 is the initially validated host. Internet access is needed for package installation, audit, and Expo doctor. Never use force/legacy-peer-deps to bypass compatibility failures.

1. Run `npm ci` in the repository root.
2. Run `npm run db:start`; keep this process open. First run initializes `.local/postgres`, generates random credentials in `.local/database-password`, creates `formation_zero` and `formation_zero_test`, and creates `.env` only if absent. It binds loopback port 55432. It does not install a system service or change system users.
3. In another terminal run `npm run db:migrate` then `npm run db:seed`.
4. Start separate terminals with `npm run dev:api`, `npm run dev:web`, `npm run dev:admin`, and optionally `npm run dev:mobile`.
5. Visit localhost:3000/account. Register a development account, privately read the matching file under `.local/mail`, open its link, and submit verification before login. Use only synthetic addresses. The three tier fixtures are disabled, have no authentication identity/password, and are not admin backdoors.
6. Stop application/database processes using Ctrl+C. PostgreSQL data persists; do not remove `.local/postgres` to reset a database that matters.

External PostgreSQL: configure `.env` from `.env.example`, create a separate database ending `_test`, and set TEST_DATABASE_URL in the process environment for tests. Deployed SMTP requires MAIL_MODE=SMTP, SMTP_URL using smtps, and MAIL_FROM. Never commit real env files. Node's `--env-file=.env` loads secrets only into server/tool processes. Client code has no secret variables.

Commands:

```sh
npm run format
npm run format:check
npm run lint
npm run typecheck
npm test
npm run security:secrets
npm run security:dependencies
npm run security:clients
npm run licenses
npm run build
npm run doctor -w @formation-zero/mobile
npm run mobile:permissions
npm run smoke
npm run smoke:dev
npm run ci:failure-probes
npm run validate
npm run validate:clean
```

`npm run start:web` / `npm run start:admin` serve built apps; admin is under `/admin`. `node --env-file=.env dist/api/start.js` runs the built API after migrations. Run `security:clients` after building. `validate:clean` requires the local PostgreSQL process, copies source into an independent OS temporary directory, installs from the lockfile, creates a disposable database, migrates/seeds, runs full validation and failure probes, then removes only that database. Logs remain under `validation-artifacts`; the source copy remains for review. All root checks use the same package lock. The authorized GitHub remote and evidence are recorded in the phase reports. Platform-admin bootstrap is an explicitly authorized operator step and must be audited; the Phase B CMS can then manage separate editorial grants.

Phase B developer references: [knowledge storage](docs/KNOWLEDGE_BASE.md), [CMS workflow](docs/ADMIN_CMS.md), [tests](docs/TESTING.md), and [current report](docs/PHASE_B_REPORT.md). Run migration 004 before starting the knowledge API. Seed remains synthetic and creates no enabled editorial account. Do not populate production content before separate Phase B2 authorization.
