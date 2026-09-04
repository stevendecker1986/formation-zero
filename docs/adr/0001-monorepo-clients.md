# 0001 — npm workspaces and foundation clients

Status: Accepted for Phase A. Date: 2026-09-04.

## Context

The repository was empty and the directive prefers TypeScript, Next.js and Expo.

## Decision

Use npm workspaces/lockfile; strict TypeScript; Next.js web/admin; Expo React Native mobile; shared domain/schemas/config/entitlements and minimal web UI.

## Consequences

No original architecture is replaced. Mobile imports pure domain only. Shells contain no fitness UI; mobile exports require no credentials. npm fits the installed environment; no build orchestrator needed.
