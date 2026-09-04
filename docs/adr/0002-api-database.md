# 0002 — Express API and PostgreSQL SQL migrations

Status: Accepted for Phase A. Date: 2026-09-04.

## Context

A secure versioned API and reproducible real PostgreSQL migrations are required.

## Decision

Use Express 5 async middleware, Zod, node-postgres parameterized SQL, versioned SQL generated once for Better Auth and reviewed foundation migrations. Advisory locks/checksums/transactions protect migration integrity.

## Consequences

SQL avoids speculative ORM domain models. Better Auth uses its supported Kysely PostgreSQL adapter internally. Embedded PostgreSQL is local/test tooling only, not a memory substitute or deployment requirement. Schema-per-test isolation avoids destructive database reset.
