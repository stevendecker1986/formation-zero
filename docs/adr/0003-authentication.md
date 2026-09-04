# 0003 — Better Auth with a restricted application API

Status: Accepted for Phase A. Date: 2026-09-04.

## Context

Password, verification/reset, revocable sessions, throttling and no account enumeration are required.

## Decision

Use pinned Better Auth with scrypt, required verification, one-day database sessions, HttpOnly host-only cookies, no cookie cache, hashed reset identifiers. Expose only strict application routes, not the full auth router. Add HMAC single-use guards for verification/reset.

## Consequences

The library verification JWT alone does not enforce one-time consumption; the wrapper does. No raw password implementation or home-grown crypto protocol. Local private file mail and in-memory test mail permit complete flows without external credentials. Production requires SMTPS. Session tokens remain sensitive database material; least privilege and encryption are required.
