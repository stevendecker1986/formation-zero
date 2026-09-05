# Phase B2 implementation plan

Status: complete; local clean validation and hosted run 33936993726 passed. See PHASE_B2_REPORT.md. Scope: controlled source and content population only.

## Audited baseline

The clean `main` checkout at `f97ca9b0a8356796c356c5cf83b88bc3137bf411` matches origin/main. Phase B's final hosted run 33932085210 succeeded. These are historical results, not a claim that B2 has passed validation.

The repository contains web, admin, mobile and API applications, shared domain/schema/entitlement/UI/knowledge packages, migrations 001–004, immutable knowledge versions, append-only reviews, separate editorial grants, independent publication approval, synthetic local/test fixtures, 40 automated tests and the existing hosted validation workflow. Preserve these implementations and historical reports.

## Gaps and decisions

- No production-candidate corpus, controlled source manifest, batch importer, corpus membership or safe corpus export exists.
- Source versions need explicit observed currency metadata. Retrieval evidence is distinct from qualified editorial verification and cannot satisfy a publication gate.
- B2 expressly requires TECHNICAL, POLICY, EDITORIAL and RIGHTS review for official policy. Strengthen the existing official provenance gate without removing any existing prerequisite.
- Synthetic fixtures must remain separate from exact B2 candidate counts.
- Original draft text, source text rights and future media rights require distinct, honest records. Unknown rights remain blocked. No professional approval or founder credential verification will be fabricated.
- Use additive schema/migration changes, a controlled idempotent import and an ADR for corpus membership, research observations and official review prerequisites.

## Execution

1. Verify official sources and changes; record dates, locators, authority and limits before writing substantive content.
2. Add the controlled corpus data/import and integrity checks using existing immutable records and audit history.
3. Author and validate four exercise batches of 25, then 30 recovery records. Include individually considered metadata, original instructions, cues, faults, cautions and traceable principle citations.
4. Include only referenced equipment; attach still-first requirements to all exercises. Import no production media and create no approvals.
5. Provide authenticated, allowlisted inspection/export and verify existing CMS editing, filters, reviews and version history against the corpus.
6. Run actual migrations/import, integrity audits, regressions, clean installation, formatting, lint, strict typecheck, security/license checks, builds, Expo checks and smoke tests. Fix B2 failures without weakening validation.
7. Commit and push to the authorized repository; observe actual hosted CI. Record results and all 23 acceptance criteria in the exact required B2 report.
8. Stop before Phase C.

## Review boundary

All populated candidates remain unpublished pending real reviews and rights decisions. Founder qualifications are owner-reported metadata unless evidence supports verification. The corpus contains general performance education, no medical treatment or programming/readiness automation.
