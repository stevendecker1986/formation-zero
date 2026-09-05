# Phase E implementation plan

Status: implementation in progress. Independent validation only; no Phase F.

## Audited baseline

The authorized starting point is clean `main` at `8801e48101076275f10b2131e4a5169026ab08e5`, synchronized with `origin/main`. Phases A, Amendment 001, B, B2, C and D have successful hosted CI. The repository contains immutable knowledge versions and review history, server-owned publication eligibility, exact Phase C rule evaluation, a framework-independent Phase D constructor, immutable prescription history, internal admin surfaces, migrations 001–007 and a 101-test regression suite. The B2 corpus remains 100 exercise and 30 recovery candidates with no production publication or fabricated approval.

## Independence and data decisions

- Add `packages/validation-engine` with its own strict prescription, request, candidate, template, validation-policy and result schemas. It may call the Phase C evaluator with exact rules, but it will not import Phase D construction, timing, ranking, selection, or invariant implementations.
- Recalculate dose work/rest/setup/transition, section totals, total duration, required-slot composition, demand exposure, equipment/environment, relationship direction and explanation consistency independently. Never alter or repair the prescription under review.
- Preserve the exact construction input required for later independent validation as authenticated encryption at rest. The service derives a dedicated AES-256-GCM key from the existing server secret. API responses, generic logs and validation history never expose raw facts. Keyed request/input/artifact fingerprints allow tamper checks without publishing low-entropy hashes.
- Add versioned immutable validation policies and append-only activation history. Test mode always uses a fixed code-owned synthetic policy. Production validation always uses the latest server-activated production policy; the client cannot supply a policy or validation status.
- Persist immutable validation history separately from editorial audit. Policy creation/activation is privileged and audited; ordinary validation history is provenance rather than editorial audit.
- Implement the production delivery gate as a read-only server decision over the latest immutable validation, blocking findings, policy warning rules and current upstream rule/content eligibility. TEST prescriptions are never deliverable.

## Validation model

The material validator returns PASS, WARN, or REJECT with stable `FZ-VAL-*` codes, check identifiers, public-safe explanations, restricted findings/trace and exact provenance. Every safety, restriction, eligibility, rights, dose, time, equipment, supervision, provenance, fingerprint or contradiction defect is blocking. WARN is reserved for explicit policy-approved nonblocking findings and can never override a blocking finding.

Production evidence is loaded from exact database versions and independently rechecked through current publication/review/rights rules. Each selected base candidate and prescribed dose is re-evaluated through Phase C. Missing or mismatched exact versions reject. Historical validation remains immutable; eligibility for a new delivery is rechecked at request time without rewriting history.

## Validation and completion

Add all 30 named adversarial mutations, clean PASS, legitimate WARN, constrained readiness cases, RED recovery, substitution, deterministic/shuffled behavior, no-safe handling, production B2/rights checks, API forgery and history/delivery tests. Extend built admin smoke and runtime grants. Run migrations, seeds, corpus import, all regressions, clean validation, format/lint/typecheck, dependency/security/license scans, web/admin/API builds, Expo checks/exports, built smoke and actual GitHub Actions. Record every acceptance criterion and stop before Phase F.
