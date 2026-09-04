# ADR 0012 — Supporting-record verification mapping

Status: proposed; owner decision pending.

The directive requires verification dates/reviewers for source versions, citations, qualifications and rights but does not assign the review types that confer verification. Proposed smallest mapping: EDITORIAL for source versions/citations and other registry metadata, RIGHTS for rights records, TECHNICAL for qualifications. Verification is derived from explicit immutable review decisions, not editable verification flags. Existing independent publisher approval remains required.

This mapping is implemented provisionally for isolated synthetic validation. It must not be treated as approved publication policy or a completed acceptance criterion until the owner responds. Affected code: `requiredReviews`, source-verification eligibility and verification projections in the knowledge store. The migration stores generic review types and does not require a schema change for a different mapping.
