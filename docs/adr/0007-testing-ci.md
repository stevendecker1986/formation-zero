# 0007 — Real database integration and clean validation

Status: Accepted for Phase A. Date: 2026-09-04.

## Context

Acceptance requires executed checks and truthful CI status.

## Decision

Use Node test runner/tsx, PostgreSQL isolation, unit/API/database tests, built-shell HTTP smoke, Expo doctor/export, format/lint/strict types, npm audit low threshold and a license/notice inventory. GitHub Actions mirrors root validation with PostgreSQL service.

## Consequences

No tests are skipped to produce green output. Intentionally invalid lint/type/test/SQL inputs verify failure propagation. Local clean-source validation differs from a hosted CI run. With no Git remote, hosted CI cannot be claimed; report the limitation explicitly.
