# ADR 0012 — Supporting-record verification mapping

Status: accepted by explicit owner approval on 2026-09-04.

The owner approved EDITORIAL verification for source versions, citations and registry metadata; RIGHTS verification for rights records; and TECHNICAL verification for qualifications. These are server-owned publication prerequisites with no client override. Verification derives from explicit immutable review decisions, not editable verification flags. Append-only review history and independent final-approver requirements remain mandatory.

The existing implementation matches the approved mapping: `requiredReviews` supplies required types to server-side eligibility, and the knowledge store derives verification projections from review history. Strict payload schemas reject client-authored verification/status overrides. Enabled account, reviewer identity/type, current grants and review expiry are checked; approval and publication recheck prerequisites. No runtime or migration change is needed to adopt this approval. Existing tests cover verification, invalid authority, append-only history and independent approval. Phase B2 population and Phase C remain excluded.
