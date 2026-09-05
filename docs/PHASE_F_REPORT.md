# Phase F final report

## PHASE

Phase F --- Individual Training Experience & Execution Foundation

## STATUS

INCOMPLETE — implementation and clean local validation pass; hosted CI is pending.

## STARTING STATE

Work began from clean, synchronized `main` commit `21b87ec71458c7967f5c38b98d0a60c2b49ea3b0`. The Phase A, Amendment 001, Phase B, Phase B2, Phase C, Phase D, and Phase E regression suites remained green.

## ARCHITECTURE

An authenticated consumer service owns the flow from request through Phase D construction, Phase E independent validation, delivery authorization, execution, actual recording, and private history. The web and Expo clients consume a minimized session projection and never receive sealed validation inputs, restricted traces, authority-bearing state, or an API for choosing validation outcomes. ADR 0017 records this boundary.

## DATABASE / MIGRATIONS

Migration `009_individual_execution.sql` adds immutable workout session snapshots, versioned current execution state, append-only execution events, separately append-only actual performance/corrections, and append-only substitution history. Foreign keys bind each runnable session to the exact prescription and validation records. Database triggers reject mutation or deletion of immutable history. Runtime grants allow only the operations required by the service.

A fresh disposable PostgreSQL database applied all migrations, seeds, and the controlled corpus successfully. A second migration run applied no files.

## AUTH / ENTITLEMENTS

Every training route requires the existing server session and enabled account. Queries and writes include the authenticated actor ID. The service resolves BASE/PERFORMANCE/COMMAND on the server and stores the granted tier as historical evidence; clients cannot submit a tier or capability grant. Cross-user reads and writes return a safe not-found result.

## SESSION REQUEST / DELIVERY

The request schema accepts bounded training intent, equipment, environment, preferences, and restrictions. It rejects readiness, load, program phase, validation status, content eligibility, and entitlement fields. Production requests invoke Phase D, persist and invoke Phase E, then invoke the existing production delivery gate. Missing policy/context, no safe prescription, and REJECT fail closed without producing a workout session. Non-production synthetic demonstrations use TEST fixtures and the exact TEST validation policy through a separate server gate that is disabled when `APP_ENV=PRODUCTION`.

## WORKOUT EXPERIENCE

Authenticated web and Expo surfaces provide session request, overview, current-exercise detail, prescribed duration/dose, equipment, purpose, instructions, controls, and status. The web adds personal completed/abandoned history and bounded persisted offline state; the native surface keeps offline state in memory. Missing approved media is shown explicitly while essential content remains textual. No exercise photograph was fabricated or imported.

## PRESCRIBED VS ACTUAL

The exact Phase D artifact and consumer projection are immutable snapshots. Actual completion, skipping, and user-entered measures are stored as separate append-only records linked to the prescribed line. Corrections append a replacement linked through `supersedes_actual_id`; they do not edit earlier facts or the prescription.

## TIMERS / STATE MACHINE

The shared deterministic engine permits `NOT_STARTED → IN_PROGRESS → PAUSED → IN_PROGRESS → COMPLETED|ABANDONED`, plus abandonment from `NOT_STARTED`. Optimistic versions reject stale commands. Elapsed time uses server timestamps, accumulated milliseconds, and an absolute running timestamp, so supported pause and background cases do not depend on interval tick counts. Terminal states reject further execution writes.

## SUBSTITUTION / SAFETY CHANGES

Substitutions accept intent and an explicit relationship target, reopen the sealed server validation context, request the relationship through Phase D, rerun Phase E and delivery authorization, and append original/replacement provenance. The client cannot directly choose a replacement artifact. A newly reported pain, restriction, unsafe equipment, or unsafe surface records the fact and safely abandons the active session; no silent repair or weaker workout is substituted.

## OFFLINE / SYNC

Offline execution begins only from an already authorized server snapshot. Web storage is limited to one consumer-safe active snapshot for 24 hours and 100 queued idempotent commands. Native state is process-memory-only. Replay is ordered and stops on a version conflict for server refresh. Logout, account switch, terminal state, and expiry clear cached private state. Offline code cannot construct, validate, deliver, elevate entitlement, authorize substitutions, or change prescribed work.

## HISTORY

The server returns only the authenticated actor's completed and abandoned sessions. Prescribed snapshots, separate actuals, substitutions, outcome, and timing remain linked for audit. Internal validation evidence and private notes are excluded from list projections.

## ACCESSIBILITY

Automated source checks passed for semantic headings, named controls, polite status updates, explicit timer labels, textual state, honest missing-media text, visible focus, reduced motion, and 44-pixel-equivalent target tokens. Web, iOS, Android, and Expo web production exports passed. Manual assistive-technology checks on release target combinations remain a release activity.

## SECURITY / PRIVACY

Controls include strict bounded schemas, existing origin/session/CSRF protections, 16 KB web proxy bodies, parameterized SQL, safe public errors, actor-scoped access, optimistic concurrency, idempotency fingerprints, append-only history, least-privilege grants, restricted validation context encryption, minimized client snapshots, cache expiry/clearing, secret scanning, and explicit mobile public-variable allowlisting. `npm audit --audit-level=low` found zero vulnerabilities. The client artifact scan checked 54 files and found no secret-boundary violation.

## SYNTHETIC / PRODUCTION BOUNDARY

Production continues to fail closed without a real active validation policy and eligible published content. No production policy was created or activated. The actual Phase B2 corpus remains pending and unavailable to production. Synthetic fixtures remain TEST-only, are visibly labeled, and the demo execution gate returns `DEMO_NOT_AVAILABLE` in production.

## FILES / ADRS

Created: the execution-engine package; Phase F API service and web BFF/training page; migration 009; Phase F execution, API, and accessibility tests; `ACCESSIBILITY.md`, `INDIVIDUAL_TRAINING_EXPERIENCE.md`, `OFFLINE_INDIVIDUAL_EXECUTION.md`, `PRESCRIBED_VS_ACTUAL.md`, `SESSION_EXECUTION_STATE.md`, `SESSION_HISTORY.md`, `PHASE_F_PLAN.md`, this report; and ADR 0017.

Modified: the Expo app, web home/account pages, shared theme, API composition and Phase D/E consumer access points, runtime grants, smoke/security scripts, regression assertions, package manifests/lockfile, workflow label, architecture/security/privacy/testing documentation, and changelog.

ADR 0017 selects immutable server-authorized execution snapshots, append-only actual facts, versioned state, and authority-free bounded clients. No other new architectural decision was required.

## TESTS / RESULTS

- `npm test`: PASS — 148 tests, 0 failures, including all A–F suites and all 30 Phase E adversarial mutations.
- Phase F focused coverage: PASS — execution transitions/timing, authenticated orchestration, ownership, entitlement resolution, request forgery rejection, D/E/delivery gating, fail-closed production, B2 exclusion, synthetic production denial, prescribed/actual separation and corrections, skips, completion/abandonment, history privacy, substitution, safety stop, offline bounds/account isolation, idempotency, concurrency, and accessibility.
- `npm run ci:failure-probes`: PASS in clean validation — invalid lint, type, test, and migration inputs were rejected.
- Fresh PostgreSQL validation: PASS — install, all migrations, seed, 100 exercise/30 recovery/16 equipment corpus import, validation, and rollback probes exited 0.
- Formatting, lint, strict typecheck, secret scan, dependency audit, license inventory, client artifact scan, mobile permission boundary, Expo Doctor, and all A–F smoke tests: PASS.

## BUILD RESULTS

- Web Next.js production build: PASS; `/training` and `/api/training/[...path]` present.
- Admin Next.js production build: PASS.
- API tsup production build: PASS.
- Expo web, iOS, and Android exports: PASS.
- Expo Doctor: PASS, 21/21 checks.
- Built-system smoke: PASS for Phase F and every A–E smoke path.
- `npm run validate:clean`: PASS; every recorded step exited 0.

## HOSTED CI

GitHub Actions, workflow `Phase A foundation`, branch `codex/phase-f-individual-training`: pending first hosted run.

## ACCEPTANCE CRITERIA

- PASS — all A–E behavior remains passing: the 148-test regression and all smoke stages passed.
- PASS — consumer individual-training experience exists: authenticated web and Expo flows build and smoke successfully.
- PASS — client cannot bypass D/E/delivery gate: API forgery and client-boundary tests pass.
- PASS — only server-deliverable prescriptions become runnable: session creation occurs only after stored Phase E PASS/WARN and delivery recheck.
- PASS — pending B2 content remains unavailable in production: actual-corpus regression passes.
- PASS — no fake production validation policy exists: database regression confirms there is no active production policy.
- PASS — synthetic/demo content is isolated: production denial and explicit labeling tests pass.
- PASS — authentication/ownership enforced: anonymous and cross-user tests pass.
- PASS — entitlements server-enforced: tier is resolved from server authorization and client tier fields are rejected.
- PASS — workout overview/exercise detail work: both consumer builds and built smoke pass.
- PASS — missing media handled honestly: textual fallback exists and accessibility test passes.
- PASS — deterministic execution state machine works: legal/illegal transition tests pass.
- PASS — prescribed artifact remains immutable: database triggers and API regression pass.
- PASS — actual performance is separately persisted: append-only actual/correction tests pass.
- PASS — skip/completion/abandonment are honest: terminal and actual-state tests pass.
- PASS — timers survive supported pause/background cases: absolute timestamp and pause/resume tests pass.
- PASS — substitution is server-authorized: relationship, revalidation, delivery, and provenance test passes.
- PASS — new restrictions fail safely: safety-change termination test passes.
- PASS — history is private: owner/cross-user projections pass.
- PASS — no advanced analytics/readiness/load calculation exists: source-boundary test and implementation audit pass.
- PASS — bounded offline execution cannot elevate authority: expiry/queue/dedupe and client-boundary tests pass.
- PASS — logout/account switch clears private cache: web source test and native logout behavior pass.
- PASS — idempotency/concurrency controls work: duplicate request/write and optimistic-conflict tests pass.
- PASS — accessibility checks pass: automated accessibility test, builds, and Expo Doctor pass.
- PASS — security/privacy checks pass: secret/client scans, zero-vulnerability audit, grants, ownership, and log-privacy tests pass.
- PASS — all required tests pass: 148 tests passed with 0 failures.
- PASS — builds/exports/smoke pass: web/admin/API builds, all Expo exports, and A–F smoke passed.
- FAIL — hosted CI passes: no hosted Phase F run has completed yet.
- PASS — documentation reflects reality: required docs, ADR, changelog, and this report describe the implemented limits.
- PASS — no Phase G work exists: scope/source audit finds no Phase G feature.

## KNOWN ISSUES

Hosted CI is the only incomplete acceptance criterion. Production session delivery remains intentionally unavailable until separately authorized real content/reviews/rights and an active production validation policy exist. Manual assistive-technology testing remains part of release validation. Native offline persistence remains disabled pending a separately reviewed secure-storage design.

## OPEN DECISIONS

Before production enablement, the owner must separately authorize a real production validation policy and eligible published content through existing review/rights gates. A future phase may decide whether native secure persistent offline storage is needed; Phase F safely uses memory only.

## PHASE G READINESS

NOT READY — hosted CI has not yet passed. Do not begin Phase G.
