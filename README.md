# Formation Zero

**Readiness Starts Here.** Phase A account and platform foundation only. Independent fitness software, not an official USMC/DoD product; no endorsement implied. Commercial launch is not authorized.

The initial repository was empty. See [the audit and implementation plan](docs/REPOSITORY_AUDIT.md), [architecture](docs/ARCHITECTURE.md), and [Phase A report](docs/PHASE_A_REPORT.md).

## Start locally

Requires Node 22.22+ within the Node 22 line and npm 10+. From the repository root:

```sh
npm ci
npm run db:start
```

Keep the database terminal open. It initializes real PostgreSQL on loopback port 55432 and generates a private `.env` with random local credentials. In another terminal:

```sh
npm run db:migrate
npm run db:seed
npm run dev:api
```

In separate terminals:

```sh
npm run dev:web
npm run dev:admin
npm run dev:mobile
```

Web: http://localhost:3000; admin: http://localhost:3001/admin; API health: http://localhost:4000/health. Register through `/account`, then privately open the generated `.local/mail/*.json` verification link. Local mail is never a public HTTP endpoint. Test fixtures are disabled and have no password.

```sh
npm run validate
```

See [development](DEVELOPMENT.md), [testing](TESTING.md), [deployment](DEPLOYMENT.md), [security](SECURITY.md), and [privacy](PRIVACY_DATA_CLASSIFICATION.md). No training, policy, CMS, formations, tracking, real billing, or AI features exist. Roles, tiers, and resource permissions are separate; COMMAND never grants formation membership.
