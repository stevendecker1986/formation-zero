# Phase C implementation plan

Status: implementation in progress. Scope: deterministic constraints only; no Phase D.

## Audited baseline

Clean main at e78359dcad9cabe49ba9dcb0fb436c587e4790e5, matching origin/main. B2 hosted run 33937844501 succeeded with 43 tests. Existing architecture includes web/admin/mobile/API, knowledge schemas and immutable versions, append-only reviews, exact provenance links, independent publisher approval, explicit editorial grants, rights/media gates, corpus import and authenticated export. B2 contains 100 exercise and 30 recovery candidates; none are published. Existing migrations 001–005 and all product/entitlement/branding boundaries remain intact.

## Implementation decisions

- Framework-independent rule-engine package: strict declarative schemas, centralized P0–P12, three-valued conditions, monotone exclusions, deterministic constraints/reason trace and canonical input hashing. No clock or randomness in material evaluation.
- Reuse knowledge RULE, REASON_CODE and RULE_SET versions, author/rights/citation links, existing reviews and independent final approval. Require the existing technical/safety/editorial/rights matrix for rule-bearing records, adding policy review for official provenance. PUBLISHER explicitly activates published production sets; PLATFORM_ADMIN alone cannot approve or activate.
- Exact references and immutable activation history in migration 006. Production rules/sets must be non-synthetic, published and currently eligible. Recheck referenced content/reviews/rights on evaluation. No initial production rule set is activated.
- Restricted editorial evaluation endpoint accepts facts and exact candidate version IDs, not client rules/approval states. Test mode permits only explicit synthetic rules/candidates. No consumer permission or entitlement is invented.
- Keep evaluation facts transient. Persist only version references, salted/HMAC input fingerprint and redacted output provenance in an isolated immutable evaluation table; generic audit/logs contain identifiers/counts only. Material output uses canonical deterministic hash; evaluated_at is envelope metadata.
- Extend existing CMS collections plus rule-set activation and evaluation inspection. Add test-only fixtures for all priorities/types and at least 14 named golden scenarios.

## Verification and completion

Run condition/effect/conflict/determinism and golden tests, PostgreSQL lifecycle/permission/production-boundary integration, all previous tests, clean install/migrations/seeds/corpus validation, format/lint/types, scans/licenses, builds/Expo and built smoke. Commit/push authorized GitHub repository, observe actual hosted CI, fix only Phase C failures. Report all 26 criteria with evidence, then stop before Phase D.
