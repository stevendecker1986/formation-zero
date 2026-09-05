# ADR 0014: Deterministic constraints and editorial boundaries

Status: accepted within the authorized Phase C specification.

## Context and decision

Reuse the Phase B immutable knowledge envelope for RULE, REASON_CODE and RULE_SET. This preserves exact references, author/rights/citations, timestamps, review history, supersession, retirement, separate grants and independent final approval. Rule-bearing records require TECHNICAL, SAFETY, EDITORIAL and RIGHTS review; official provenance additionally requires POLICY. This applies existing conservative gates to safety-bearing machinery; no professional approval is inferred. PUBLISHER is the existing authority for explicit production activation. PLATFORM_ADMIN alone cannot activate. No new consumer role or entitlement is introduced.

The evaluator lives in a framework-independent package with Zod and Node's cryptographic hash utility; schemas have a separate browser-safe export. Declarative expressions cannot execute code or fetch URLs. Explicit as_of and exact snapshots determine material output. Database timestamps and random audit IDs are envelope metadata, excluded from deterministic output.

P0–P12 is centralized. Same-priority cap conflicts take the minimum; incompatible attribute requirements block. Other ties use permanent rule ID, version and canonical effect ordering. Blocks are monotone. Scores form a priority-ordered vector; sorting only covers eligible candidates and does not select an exercise/session. Unknown safety/restriction/policy/eligibility facts block. Other unknown facts block or require review, always withholding automatic use.

The editorial evaluation API loads active production rules and candidate metadata server-side. It rejects client status/rule/eligibility fields. Test mode only accepts explicitly synthetic rule sets and server-marked synthetic candidate snapshots. Optional rule_metadata is added to exercise/recovery versions; missing values remain unknown. B2 records are unchanged and remain unpublished.

## Privacy and consequences

Facts stay transient; no raw snapshot is persisted. Canonical SHA-256 is returned only in the authorized evaluation response. Stored fingerprints use domain-separated HMAC-SHA-256 with the server secret. The isolated append-only evaluation table retains exact version references, eligibility, constraints and reason codes; these may reveal health-adjacent inferences and remain restricted to the evaluating editorial actor. Generic audit/logs record identifiers/counts, never facts, hashes or results. There is no marketing integration or consumer evaluation API. A replay needs the caller's separately protected original input; the server cannot reconstruct it. Key rotation changes HMAC comparisons.

No initial production set is activated. All shipped rules are synthetic pending fixtures, not approved policy/training guidance. Immutable audit retention follows the existing controlled-environment policy; production retention/deletion decisions for real evaluation data remain a launch prerequisite. No Phase D implementation is authorized.
