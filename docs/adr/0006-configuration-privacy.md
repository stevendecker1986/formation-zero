# 0006 — Private fail-fast config and ACCOUNT-only data

Status: Accepted for Phase A. Date: 2026-09-04.

## Context

Four stable environments, privacy minimization and secure logs are required.

## Decision

Zod validates server-only configuration, requires production HTTPS/verified DB TLS/SMTPS, and rejects commercial true. Random generated local secrets are ignored. Logs allowlist fields; queries, tokens, bodies, raw errors and IP/email are excluded.

## Consequences

Library optional tracking/image/provider-token fields are NULL-constrained. No health/location fields or device permissions. Local file permissions use POSIX modes and Windows inherited ACLs; documented private workspace required. Display names are pseudonyms, not required legal identities.
