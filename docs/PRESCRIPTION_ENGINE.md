# Individual prescription engine

Phase D constructs candidate sessions; independent validation belongs to a separately authorized Phase E. Core: `packages/prescription-engine`, depending only on Phase C, Zod and Node cryptographic hashing. No HTTP, UI, AI, random selection, billing, group scheduling or physiology calculation.

`prescribe` validates the complete construction input, evaluates all scoped base candidates through Phase C, then evaluates every relevant explicit dose snapshot through Phase C. Base blocks remain permanent. It selects a deterministic complete mandatory composition, then optional slots, and enforces local construction assertions. A result is a candidate prescription, never a claim of clinical safety or independent validation.

Production service loads the active rule set, exact published template and exact candidate versions under the existing editorial transaction lock. It calls the same Phase C loaders used by rule evaluation. Current publication, reviews, rights and transitive references are rechecked. Missing prescription profiles fail safely. No production dosing defaults were introduced. Real B2 candidates remain unpublished and non-prescribable.

PRESCRIPTION_TEMPLATE is versioned editorial content with TECHNICAL, SAFETY, EDITORIAL and RIGHTS reviews, POLICY when applicable, and an independent final approver. Synthetic identity cannot change on a subsequent template version. Fixture catalog updates are code-reviewed commits and CI artifacts, never an HTTP mutation or production activation.

See ADR 0015 and the request, structure, dosing, substitutions and provenance documents.
