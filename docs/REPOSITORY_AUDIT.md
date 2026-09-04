# Phase A repository audit

Recorded 2026-09-04 before implementation. Authority: the full supplied Formation Zero Codex RCGOA Master Directive — Phase A, read before this audit.

## Initial state

- Workspace: `FORMATION ZERO`; only `.git` exists, with no commits, tracked files, remotes, or application files (`git status`, `git log`, `git ls-files`, `rg --files`, and hidden-file listing inspected).
- No apps, packages, frameworks, workspace manager, database, authentication, API, tests, CI, environment files, documentation, ADRs, security controls, or deployment configuration exist.
- No applicable ancestor AGENTS.md was found. Nothing to preserve or replace; no destructive repository work is needed.
- Host: Windows, Node 22.23.2, npm 10.9.8. PostgreSQL, psql, and Docker are absent from PATH. npm access requires sandbox network escalation. Git exists but no remote CI is configured.

## Requirement comparison and implementation plan

All implementation requirements are initially MISSING. Execute this plan in order; validation evidence and remaining gaps go in PHASE_A_REPORT.md.

| Specification            | Initial state    | Planned Phase A work                                                                                                                          |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| O1 / A1                  | Empty repository | Preserve audit and plan before implementation.                                                                                                |
| O2–3 / A2–3              | Missing          | npm workspaces, strict TypeScript, Next.js web/admin, Expo mobile, TypeScript API; document material choices.                                 |
| O4 / A4–6                | Missing          | Minimal independent-brand shells; server-protected admin; no sensitive mobile permissions.                                                    |
| O5 / A7                  | Missing          | Health/versioned API, validation, request IDs, safe errors/logs, auth and separate authorization primitives.                                  |
| O6–7 / A8                | Missing          | Real PostgreSQL; transactional SQL migrations, isolated test database, synthetic seeds; only ACCOUNT and infrastructure tables.               |
| O8 / A9                  | Missing          | Proven authentication library with email/password, verification/reset, expiring revocable sessions, throttling, generic public responses.     |
| O9 / A10                 | Missing          | Exact five roles, default USER, server-owned membership, tested forgery denial.                                                               |
| O10–12 / A11–12          | Missing          | Exact three tiers, centralized inherited capability foundation, resource permission kept separate, false legal gate, no billing integration.  |
| O13 / A13                | Missing          | Append-oriented audit events and transactional privileged changes.                                                                            |
| O14–16 / A14–15          | Missing          | Domain/runtime schemas/config, exact enums, conservative publishability, private environment validation.                                      |
| O17–18 / A16             | Missing          | Headers/origin checks/cookies/throttling, parameterized queries, sanitized logs, secret and dependency checks, documented threat assumptions. |
| O19 / A17                | Missing          | Unit/API/DB/auth tests for every required case, isolated database lifecycle.                                                                  |
| O20–21 / A18–19          | Missing          | Failing-on-error CI, clean validation, dependency license inventory and checks.                                                               |
| O22–24 / A20             | Missing          | ADRs and all required operational documents, exact commands, synthetic fixtures.                                                              |
| O25 / A21 and boundaries | No features      | No Phase B functionality; clean install → database → migration → seed → checks → builds → health/auth/admin smoke.                            |

## Decisions and concerns

- Technical ADRs needed: monorepo/clients, backend, SQL migrations, authentication/sessions, role/entitlement/resource boundaries, audit, configuration, CI/test deployment.
- The directive names future capabilities but does not explicitly assign every capability to tiers. Implement only the clearly stated PERFORMANCE individual / COMMAND leader inheritance foundation, document the mapping as a foundation requiring owner confirmation before future feature activation. No fitness endpoints or features may be activated by these flags.
- Content publication workflow is not authorized. A helper can deny UNKNOWN rights and non-approved statuses without implementing publishing or asserting rights approval.
- No email provider or deployment account supplied. Local/test mail must remain private and testable, and deployed mail configuration must fail closed; never send unsolicited messages.
- Real remote clean-checkout CI cannot be claimed without a configured remote/run. Execute an equivalent local clean-source pipeline and explicitly distinguish it from hosted CI.
- PostgreSQL must actually run for database acceptance; an in-memory SQL substitute is insufficient. Use a project-local real PostgreSQL binary if available through a reviewed dependency.

## Scope guard

Only minimal ACCOUNT/profile data, exact roles/tiers, legal gate false, rights/provenance/status foundations. No fitness, medical, USMC policy, CMS, formations, tracking, billing, or AI implementation. Commercial launch remains unauthorized.
