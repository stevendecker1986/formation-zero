# 0004 — Separate identity, roles, tiers and resource permissions

Status: Accepted for Phase A. Date: 2026-09-04.

## Context

ROLE != SUBSCRIPTION != RESOURCE_PERMISSION; capability assignments required clarification.

## Decision

Owner approved the explicit 0/6/9 mapping on 2026-09-04. Centralize it in entitlements: BASE none; PERFORMANCE six individual; COMMAND those plus Unit PT, Live PT and formation analytics. USER is default; PLATFORM_ADMIN alone accesses admin shell.

## Consequences

COMMAND does not grant roles/membership. Resource permission always denies because no resource domain exists. No fitness endpoints are activated. Internal privileged-change helper requires an enabled PLATFORM_ADMIN and audits atomically. No public privilege mutation endpoint. Legal gate is false and cannot be turned on in Phase A.
