# Phase B — audit, requirement comparison and implementation plan

Baseline: clean main at 72d107c8e045d705dc2f600a4fa3f7902b73fc8e, synchronized with authorized origin after fetch (0 ahead / 0 behind). Full Phase B directive and execution authorization read before changes. Phase A and Amendment 001 are complete. Phase B2 and C are excluded.

## Existing foundations

Express/Better Auth authenticates enabled accounts and preserves origin/JSON checks, private cookies, safe logs and errors. Existing PLATFORM_ADMIN protects the original admin page; consumer roles and entitlement mappings stay unchanged. PostgreSQL uses transaction/checksum migrations 001–003, schema-isolated tests, append-only audit triggers and a least-privilege deployment template. Shared domain contains lifecycle/provenance/rights enums, but no knowledge storage or CMS. Next admin and Expo/web share Amendment 001 tokens; no new visual identity is needed. Existing CI runs root validation, real PostgreSQL and failure probes. Existing test asserting migration list must expand to include Phase B while preserving its prior assertions.

## Requirement comparison and planned work

| Directive coverage | Current state                               | Phase B work                                                                                                                                               |
| ------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O1–3 / A1–3        | Audit primitives only; no knowledge records | Isolated knowledge package, strict schemas, one forward migration, permanent FZ codes, immutable version payloads.                                         |
| O4–7 / A4          | Missing                                     | Source/source-version/section/citation kinds, typed exact-version foreign-key links, locators instead of copied corpus.                                    |
| O8–12 / A5         | Future requirements documented              | Editorial authors/qualifications/reviewer records; separate grants and append-only reviews; server-owned gates pending owner matrix decision.              |
| O13–21 / A6        | Missing                                     | Exact movement/capability taxonomies, exercises/variants/directional links, DB score constraints, restrictions as metadata only.                           |
| O22–24 / A7–8      | Missing                                     | Equipment and recovery version schemas and explicit relationships; no automated interpretation.                                                            |
| O25–27 / A9–10     | Rights enum only                            | Still-first requirements, metadata-only assets, versioned rights evidence; no fetching or generation of media.                                             |
| O28–30 / A11       | Necessary-condition helper only             | Central eligibility, approve/publish/supersede/retire, lineage and history; immutable content separate from lifecycle projection.                          |
| O31–35 / A12–15    | Protected shell only                        | Separate knowledge CMS, typed forms, filters, review/publication queue, authenticated APIs and transactional audit. No public knowledge reads in Phase B.  |
| O36–38 / A16–17    | Phase A tests/seeds                         | Minimal explicitly synthetic fixtures, real API/DB/workflow tests, privacy/forgery/concurrency/immutability checks and unchanged full regression pipeline. |
| O39 / A18–19       | Phase A/amendment docs                      | Knowledge/lifecycle/provenance/rights/authorship/media/admin docs, ADRs, clean validation, hosted CI and full acceptance report.                           |

## Migration and architecture plan

Add kb-prefixed entities, immutable versions, typed links, taxonomies, lifecycle projection, review history and editorial grants. Use UUID version identity plus sequence-generated permanent FZ entity codes. Source registry and all auxiliary editorial records use the same immutable version envelope with kind-specific strict payloads; explicit foreign-key links preserve reference integrity. Creating an edit creates another version, even before publication. No deletion API: drafts can be retired and history is retained. Publication never changes a payload; transitions update separate state and append audited history. No schema/editorial fields enter ordinary profiles. All write operations lock actor and record, validate expected revision, recheck authority and audit in the same transaction.

Drafts and credential identifiers remain behind authenticated editorial APIs; no public content endpoint or external URL fetch. No billing activation; publication in the internal CMS is not commercial-launch approval. One isolated migration 004, no rewrite of 001–003. Forward fixes are preferred; restore a verified pre-migration backup only before dependent writes, never destructively drop published history.

## Product decisions resolved

Owner explicitly approved the exercise/recovery/media review matrix, policy review for official content, independent final approval, and separate editorial grants (ADR 0011). The owner subsequently approved EDITORIAL verification for source versions/citations and registry metadata, RIGHTS for rights records and TECHNICAL for qualifications (ADR 0012), with server-owned prerequisites, no client override and append-only history. This resolves the review-policy decision identified during the original plan. Rights evidence cannot be inferred from host/government status or professional credentials.
