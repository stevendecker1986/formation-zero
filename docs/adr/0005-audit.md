# 0005 — Transactional append-oriented audit

Status: Accepted for Phase A. Date: 2026-09-04.

## Context

Privileged changes need actor/action/entity/time/reason/metadata/request context.

## Decision

Use PostgreSQL audit_events with mutation/TRUNCATE rejection triggers, fixed action/reason vocabulary, allowlisted metadata and UUID request IDs. Write change and audit in one transaction. Separate runtime DB login may only SELECT/INSERT audit rows.

## Consequences

Database owners are trusted and can bypass triggers; production runtime must not own schema. No audit UI, retention invention or analytics pipeline. Synthetic seed events are explicit local fixtures.
