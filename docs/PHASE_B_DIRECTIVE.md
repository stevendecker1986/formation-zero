# FORMATION ZERO — CODEX RCGOA MASTER DIRECTIVE
## Phase B — Knowledge Base Foundation
### Authority: Formation Zero v1.0-PLAN + Amendment 001
### Scope: PHASE B ONLY

> Paste this entire document into Codex. Do not begin Phase B2 content population or any later phase.

# R — ROLE

You are continuing as the Principal Software Architect, Staff Full-Stack Engineer, Database Architect, Content Systems Architect, Security/Privacy Engineer, and Technical Documentation Lead for **Formation Zero**.

Phase A is COMPLETE. The post-Phase-A Product Positioning, Brand & Authorship Amendment is COMPLETE. Hosted CI passes.

Implement **Phase B — Knowledge Base Foundation only**.

Do not redesign Formation Zero. Do not change the subscription model. Do not invent fitness doctrine, Marine Corps policy, medical guidance, or content rights. Do not ingest proprietary ISSA material. Do not implement the training engine. Do not begin Phase B2 or Phase C.

For low-level technical choices that do not alter product behavior, choose the simplest secure maintainable production-grade option and record material decisions as ADRs. If a product-level ambiguity materially affects data semantics, review gates, provenance, rights, or safety, document it rather than guessing.

# C — CONTEXT

**FORMATION ZERO — Readiness Starts Here.**

Formation Zero is a universal fitness, human-performance, recovery, readiness, and group-training platform. It is not a Marine Corps-only product and not an official USMC/DoD product. Marine Corps human-performance resources are a foundational source because of the founder's background, not a target-market boundary.

Potential users include general fitness users, beginners, recreational athletes, strength/muscle-development users, runners, hybrid athletes, ruckers, tactical athletes, military personnel, veterans, firefighters, law enforcement, first responders, personal trainers, coaches, sports teams, academies, ROTC programs, group fitness leaders, organizations, and users preparing for physically demanding occupations.

The founder holds:
- ISSA Certified Personal Trainer
- ISSA Specialist in Bodybuilding

These qualifications may inform Formation Zero original programming within appropriate scope. They do **not** authorize reproducing proprietary ISSA textbooks, courseware, diagrams, tables, media, branded programs, or wording. Do not imply ISSA endorsement.

## Knowledge streams

Formation Zero may later contain content informed by:
1. Publicly releasable Marine Corps human-performance material
2. Professional fitness education
3. Exercise science / human-performance evidence
4. Qualified specialty review
5. Formation Zero original methodology

## Content is not code

The knowledge base is the authoritative home for future:
- sources
- source versions
- source sections
- citations
- authors
- professional qualifications
- reviewers
- exercises
- exercise variants
- exercise relationships
- movement patterns
- capabilities
- demand profiles
- restrictions
- equipment
- recovery methods
- media requirements
- media assets
- rights records
- review workflows
- publication states
- immutable versions
- supersession/retirement

## Stable classifications

Content lifecycle:
`DISCOVERED`, `INGESTED`, `SOURCE_VERIFIED`, `TECHNICALLY_REVIEWED`, `SAFETY_REVIEWED`, `EDITORIALLY_REVIEWED`, `APPROVED`, `PUBLISHED`, `SUPERSEDED`, `RETIRED`

Provenance:
`OFFICIAL`, `OFFICIAL_DERIVED`, `FZ_DERIVED`, `FZ_ORIGINAL`, `SUPPORTING_EVIDENCE`

Rights:
`FORMATION_ZERO_ORIGINAL`, `US_GOVERNMENT_WORK_VERIFIED`, `PUBLIC_DOMAIN_VERIFIED`, `LICENSED`, `PERMISSION_GRANTED`, `THIRD_PARTY_COPYRIGHT`, `UNKNOWN`

`UNKNOWN` rights must remain non-publishable.

## Separation of concerns

SOURCE PROVENANCE = where support comes from.
AUTHORSHIP = who created the Formation Zero expression/programming.
PROFESSIONAL QUALIFICATION = relevant credential of creator/reviewer.
TECHNICAL REVIEW = technical fitness review.
SAFETY REVIEW = safety-sensitive review.
SPECIALTY REVIEW = discipline-specific review.
RIGHTS PROVENANCE = ownership/publication rights.

Do not collapse these concepts.

## Exercise media decision

Formation Zero v1 uses **still-image exercise demonstrations as the default media model**. Video is optional.

Support:
- one to four stills per exercise as appropriate
- START
- KEY_POSITION
- FINISH
- optional ALTERNATE
- optional COMMON_FAULT
- optional REGRESSION
- optional PROGRESSION
- optional video for timing/sequencing-heavy movements

Generated or commissioned exercise imagery must later pass technical review before publication.

Do not generate images in Phase B.
Do not bulk-ingest final exercise media.

## Subscription model

Unchanged:
- BASE
- PERFORMANCE
- COMMAND

Do not modify entitlement mappings in Phase B.

# G — GOAL

Implement **Phase B — Knowledge Base Foundation**.

Deliver a production-grade, versioned, auditable, rights-aware, review-gated content system capable of supporting later source ingestion and exercise/recovery population.

Phase B must establish:
1. Source registry
2. Source versioning
3. Source sections
4. Citations
5. Authors
6. Qualifications
7. Reviewers
8. Review records
9. Exercise schema
10. Exercise variants
11. Exercise relationships
12. Movement taxonomy
13. Capability taxonomy
14. Demand profiles
15. Restrictions
16. Equipment catalog
17. Recovery schema
18. Recovery relationships
19. Media requirements
20. Media asset metadata
21. Rights records
22. Review workflow
23. Publication/versioning
24. Supersession/retirement
25. Knowledge APIs
26. Admin CMS
27. Audit coverage
28. Authorization
29. Tests
30. CI
31. Documentation

At completion, the repository must be ready for **Phase B2 — Controlled Source & Exercise Population**.

Do not populate the planned production corpus during Phase B.

# O — OBJECTIVES

## O1 — Audit Current Repository
Inspect Phase A + Amendment 001, migrations, domain/schema packages, admin authorization, audit framework, design system, CI, and ADRs. Preserve passing architecture. Write a Phase B implementation plan before major schema work.

## O2 — Knowledge Domain Boundaries
Keep editorial knowledge data separated from authentication, subscriptions, future training sessions, formations, readiness, health, and GPS data. Do not put editorial metadata into ordinary user profiles.

## O3 — Stable IDs
Use stable Formation Zero identifiers such as:
- FZ-SRC-000001
- FZ-EX-000001
- FZ-RCV-000001
- FZ-EQP-000001
- FZ-CIT-000001

Internal UUIDs are acceptable, but stable FZ codes must be unique and never reused. Document generation strategy.

## O4 — Source Registry
Support:
- id
- stable_source_code
- title
- issuing_authority
- source_type
- source_url / locator where appropriate
- publication_number
- publication_date
- current_status
- provenance_classification
- notes
- timestamps

Future source types should support:
`ORDER`, `DIRECTIVE`, `MARADMIN`, `GUIDE`, `MANUAL`, `ARTICLE`, `RESEARCH`, `COURSE_MATERIAL`, `WEBSITE`, `POLICY`, `BOOK`, `OTHER`

Do not treat ISSA proprietary courseware as automatically ingestible.

## O5 — Source Versions
Support:
- source_id
- version identifier
- effective_date
- superseded_date
- publication/change identifier
- checksum/fingerprint where appropriate
- content locator/reference
- verification date/status
- reviewer
- notes

Historical versions must remain queryable and immutable.

## O6 — Source Sections
Support granular locators:
- source_version_id
- section_code
- section_title
- page_start/page_end
- paragraph/section locator
- excerpt_note
- normalized locator

Do not store long copied source text by default. Prefer locators, notes, and citations.

## O7 — Citations
Create citations linking Formation Zero content to source sections with:
- citation code
- source/version/section
- citation purpose
- support type
- notes
- created_by
- verified_by
- verified_at

One content record may have multiple citations.

## O8 — Content Authorship
Create editorial author records separate from ordinary platform profiles where appropriate:
- author_id
- display_name
- author_role
- public affiliation if relevant
- active/inactive
- notes

## O9 — Professional Qualifications
Qualification metadata must be separate from source provenance:
- qualification_id
- author/person reference
- credential_name
- issuing_organization
- credential_identifier if appropriate
- issued_date
- expiration_date
- status
- verification_status
- verification_date
- notes

Do not expose private credential identifiers publicly by default.

Architecture must support the founder's ISSA CPT and Bodybuilding Specialist credentials without implying endorsement.

## O10 — Reviewer Model
Support reviewer identities and review types:
- TECHNICAL
- SAFETY
- EDITORIAL
- RIGHTS
- POLICY
- SPECIALTY

Specialty categories may include:
- NUTRITION
- SPORTS_MEDICINE
- ENDURANCE
- STRENGTH_CONDITIONING
- FORCE_FITNESS
- MCMAP
- OTHER

Allow safe extension.

## O11 — Review Records
Capture:
- entity_type
- entity_id
- entity_version
- review_type
- reviewer_id
- status
- decision
- comments
- reviewed_at
- optional re-review date

Review history is append-oriented; never overwrite prior decisions.

## O12 — Four-Eyes Approval
Architecture must support author != final approver for high-risk content, including future safety rules, restriction mappings, official policy/scoring, and automated programming rules.

## O13 — Movement Taxonomy
Implement:
Push, Pull, Squat, Hinge, Lunge, Rotation, Anti-Rotation, Brace, Carry, Locomotion, Crawl, Ground-to-Standing, Jump, Land, Throw, Sprint, Change of Direction, Climb, Drag, Lift, Aquatic.

Support one primary and multiple secondary movements.

## O14 — Capability Taxonomy
Implement:
Maximal Strength, Relative Strength, Strength Endurance, Power, Speed, Acceleration, Agility, Aerobic Endurance, Anaerobic Capacity, Muscular Endurance, Work Capacity, Mobility, Stability, Coordination, Balance, Grip, Running, Rucking, Load Carriage, Aquatic Conditioning, Tactical Conditioning, Recovery, Durability.

Support primary and secondary capabilities.

## O15 — Exercise Record
Exercise schema must support:
- stable exercise code
- name
- aliases
- summary
- original Formation Zero instruction text
- primary/secondary movements
- primary/secondary capabilities
- equipment requirements
- technical complexity
- demand profile
- formation suitability
- individual suitability
- scaling availability
- restriction mappings
- media requirement
- provenance
- authorship
- rights
- content status
- version
- effective/published dates

Use minimal synthetic fixtures only.

## O16 — Technical Complexity
Support:
1 SIMPLE
2 BASIC
3 INTERMEDIATE
4 ADVANCED
5 EXPERT/SUPERVISED

## O17 — Exercise Demand Profile
Support 0–5 values:
- muscular_demand
- cardiovascular_demand
- neurological_demand
- impact_demand
- upper_body_demand
- lower_body_demand
- trunk_demand
- grip_demand
- axial_loading
- eccentric_loading
- technical_demand
- running_interference
- rucking_interference
- recovery_cost

Validate at schema and DB level where practical.

## O18 — Formation Suitability
Support:
Individual, Partner, Fire Team, Squad, Platoon, Company+

Scale:
0 inappropriate
1 poor
2 constrained
3 suitable
4 highly suitable
5 ideal

These are execution metadata, not military-only access controls.

## O19 — Exercise Variants
Support variants such as:
- FOUNDATION
- READY
- PERFORM
- alternate equipment
- low-impact
- limited-space
- no-equipment
- other approved variants

A variant may reference a parent exercise.

## O20 — Exercise Relationships
Support:
REGRESSION, PROGRESSION, SUBSTITUTION, LOW_IMPACT, NO_EQUIPMENT, LIMITED_SPACE, UNIT_PT, FUNCTIONAL_RESTRICTION, RECOVERY.

Directional where appropriate. Do not infer automatically.

## O21 — Exercise Restrictions
Support structured restriction metadata:
- movement/body-region category
- restriction category
- severity/eligibility behavior
- source/reviewer
- notes

Do not implement diagnosis or clinically specific medical rules.

## O22 — Equipment Catalog
Support:
- stable equipment code
- name
- aliases
- category
- portable/fixed
- quantity semantics
- notes
- status
- provenance where relevant

Synthetic fixtures may include pull-up bar, dumbbell, barbell, band, cone, sandbag, ammo can, no equipment.

Keep taxonomy organization-neutral.

## O23 — Recovery Method
Support:
- stable code
- name
- category
- purpose
- typical use
- demand/intensity
- duration guidance
- equipment
- body area
- provenance
- authorship
- reviews
- rights
- status
- version

Extensible categories may include Mobility, Active Recovery, Cooldown, Low-Intensity Aerobic, Breathing, Sleep Education, Hydration Education, Nutrition Education, Deload, Post-Run, Post-Ruck, Post-Field.

## O24 — Recovery Relationships
Allow relationships to exercise, movement, capability, training type, body area, and preceding stress category. Do not implement adaptive recovery logic.

## O25 — Media Requirement Model
Default v1 exercise media strategy: `STILL_SEQUENCE`.

Support:
- media_requirement_type
- minimum_images
- recommended_images
- maximum_images
- required_views
- motion_complexity
- video_recommended
- video_required
- technical_media_review_required
- rights_review_required
- notes

Suggested media types:
`NONE`, `SINGLE_STILL`, `STILL_SEQUENCE`, `OPTIONAL_VIDEO`, `VIDEO_RECOMMENDED`

Views:
`START`, `KEY_POSITION`, `FINISH`, `ALTERNATE`, `COMMON_FAULT`, `REGRESSION`, `PROGRESSION`

Motion complexity:
`LOW`, `MODERATE`, `HIGH`

For v1, `video_required` defaults false unless explicitly approved later.

Do not generate or import production exercise images.

## O26 — Media Asset Metadata
Support future image/video/illustration/diagram/audio assets:
- stable asset id
- content relation
- asset type
- view type
- storage locator
- checksum
- dimensions/duration
- creator
- rights status
- license/permission
- technical review status
- rights review status
- publication status
- created_at

Do not build an unnecessary transcoding system.

## O27 — Rights Record
Support:
- rights classification
- rights holder
- creator
- source
- license
- commercial_use_allowed
- modification_allowed
- attribution_required
- permission_reference
- verification_date
- reviewer
- notes

`UNKNOWN` must block publication.

## O28 — Publication Eligibility
Create centralized server-side eligibility checks. Publication must be able to fail for:
- content status not eligible
- rights UNKNOWN
- required review incomplete
- required author/reviewer data missing
- required source verification missing
- version conflict

Never rely only on client-side checks.

## O29 — Versioning
Published content is immutable. Editing published content creates a new draft/version. Historical versions remain queryable and later training records must be able to reference exact versions.

## O30 — Supersession/Retirement
Support:
- superseded_by
- supersedes
- retired_at
- retirement_reason

Never delete historical published content merely because it was superseded.

## O31 — Admin CMS Foundation
Build secure Phase B admin screens for:
- Sources
- Source Versions
- Source Sections
- Citations
- Authors
- Qualifications
- Reviewers/Reviews
- Exercises
- Exercise Relationships
- Equipment
- Recovery Methods
- Media Requirements
- Rights Records
- Publication/Review Queue

Use the approved Formation Zero admin design system.

## O32 — Admin Authorization
Use existing Phase A authorization. Do not repurpose consumer roles carelessly.

If dedicated editorial roles/permissions are needed, prefer concepts such as:
`CONTENT_EDITOR`, `TECHNICAL_REVIEWER`, `SAFETY_REVIEWER`, `POLICY_REVIEWER`, `RIGHTS_REVIEWER`, `PUBLISHER`

These are internal permissions, not subscription tiers.

## O33 — APIs
Create secure versioned knowledge APIs supporting appropriate CRUD plus:
- version creation
- review submission
- publication eligibility
- publish
- supersede
- retire
- provenance lookup
- rights lookup

If public reads are created, only PUBLISHED content may be exposed. Draft/review content is admin-only.

## O34 — Audit Coverage
Audit source changes, provenance changes, rights changes, review decisions, publish, supersede, retire, qualification verification changes, and privileged editorial permission changes.

## O35 — Search
Basic admin search/filtering by source, exercise, recovery, equipment, status, provenance, rights, review status. No AI semantic search.

## O36 — Seed Data
Minimal synthetic fixtures only: one synthetic source/version/exercise/recovery, a few equipment entries, one author, one reviewer, one rights record, one review flow.

No bulk production corpus.

## O37 — Data Integrity
Use constraints where practical for unique codes, score ranges, valid status, version lineage, foreign keys, timestamps, unique version numbers, and rights/review consistency.

## O38 — Security/Privacy
Store only necessary author/reviewer/credential information. Credential identifiers and private reviewer notes are not public by default. Internal audit metadata is not exposed publicly.

## O39 — Documentation
Create/update:
- docs/KNOWLEDGE_BASE.md
- docs/CONTENT_LIFECYCLE.md
- docs/SOURCE_PROVENANCE.md
- docs/RIGHTS_MANAGEMENT.md
- docs/AUTHORSHIP_AND_REVIEW.md
- docs/MEDIA_CONTENT_MODEL.md
- docs/ADMIN_CMS.md
- docs/ARCHITECTURE.md
- docs/SECURITY.md
- docs/PRIVACY_DATA_CLASSIFICATION.md
- docs/TESTING.md
- docs/CHANGELOG.md
- ADRs as needed

Clearly distinguish Phase B foundation from Phase B2 population.

# A — ACTIONS & ACCEPTANCE

Execute in order.

## A1 — Phase B Audit and Plan
Inspect current repo and write Phase B implementation plan before major changes.

**Accept when:**
- current schema/auth/admin/design/audit foundations are documented
- migration plan exists
- no Phase A regressions are introduced

## A2 — Domain and Schema Foundations
Implement stable knowledge-domain types and runtime schemas.

**Accept when:**
- typecheck passes
- invalid enum/range payloads are rejected
- stable IDs and version semantics are documented

## A3 — Database Migrations
Create reproducible Phase B migrations for sources, authorship/review, exercises, recovery, equipment, media metadata, rights, and versioning.

**Accept when:**
- clean DB migrates from Phase A through Phase B
- rollback/forward strategy documented
- constraints tested

## A4 — Source Registry
Implement sources, versions, sections, citations.

**Accept when:**
- synthetic source supports multiple versions
- historical versions remain unchanged
- citations target sections
- provenance is queryable

## A5 — Authorship / Qualification / Review
Implement authors, qualifications, reviewers, review records.

**Accept when:**
- qualification != provenance
- review history is append-oriented
- credential identifiers are private by default
- four-eyes capability exists

## A6 — Exercise Model
Implement exercises, variants, relationships, movement/capability taxonomies, demand profiles, formation suitability, restrictions.

**Accept when:**
- range constraints work
- primary + secondary relationships work
- directionality is preserved
- no prescription logic exists

## A7 — Equipment
Implement organization-neutral equipment catalog.

**Accept when:**
- synthetic CRUD works
- quantity semantics can support future logistics
- no Marine-only assumption is built into taxonomy

## A8 — Recovery
Implement recovery methods and relationships.

**Accept when:**
- synthetic recovery can be authored/reviewed/versioned
- no adaptive recovery engine exists

## A9 — Media Requirements
Implement still-sequence-first media requirements and asset metadata.

**Accept when:**
- STILL_SEQUENCE works
- START/KEY_POSITION/FINISH can be represented
- video is optional by default
- technical media review can be required
- no production media is generated/imported

## A10 — Rights
Implement rights records and server-side publishability checks.

**Accept when:**
- UNKNOWN rights blocks publication
- eligible rights may pass when all other requirements pass
- rights changes are audited

## A11 — Publication Workflow
Implement draft/review/approve/publish/supersede/retire behavior.

**Accept when:**
- published versions are immutable
- edits create new draft/version
- missing required reviews block publication
- author/final-approver separation can be enforced
- history remains queryable

## A12 — Admin CMS
Build secure knowledge admin screens.

**Accept when:**
- authorized editorial staff can manage synthetic records
- ordinary USER is denied
- review queue works
- publish is server-authorized
- design system remains aligned

## A13 — Knowledge APIs
Implement secure APIs.

**Accept when:**
- CRUD/version/review/publish endpoints validate input
- drafts are not public
- public reads, if present, expose only PUBLISHED content
- client cannot forge status/review/publish authority

## A14 — Search / Filters
Implement basic admin search/filtering.

**Accept when:**
- filtering works for source/exercise/recovery/equipment/status/provenance/rights/review
- no AI dependency introduced

## A15 — Audit
Expand editorial audit coverage.

**Accept when:**
- critical editorial transitions emit audit events
- audit history remains immutable to ordinary admins

## A16 — Tests
Implement comprehensive Phase B tests.

Required test families:

### Sources
- source create
- source version create
- historical immutability
- section/citation linkage

### Authorship
- author creation
- qualification separation
- private credential behavior

### Reviews
- technical review
- safety review
- rights review
- review history
- four-eyes enforcement where configured

### Exercises
- exercise create
- movement/capability relationships
- demand range rejection
- formation-suitability range rejection
- relationship directionality
- version creation

### Recovery
- recovery create/version/review

### Media
- still-sequence requirement
- required-view validation
- optional-video default
- media rights/review linkage

### Rights
- UNKNOWN publication denied
- approved rights + complete reviews publication allowed
- rights transition audited

### Publishing
- incomplete draft cannot publish
- published version immutable
- new version from published record
- supersede
- retire

### Authorization
- USER denied admin
- content editor limited appropriately
- reviewer permissions enforced
- publisher permission enforced
- client-forged status/review rejected

### Regression
- all Phase A auth/entitlement/security tests remain passing

## A17 — CI
Update hosted CI for all Phase B migrations/tests/builds.

**Accept when:**
- local clean validation passes
- hosted GitHub Actions passes
- checks are not weakened

## A18 — Documentation
Complete Phase B docs/ADRs/changelog.

**Accept when:**
- a new developer can understand the lifecycle
- provenance/authorship/rights distinctions are clear
- Phase B2 population is explicitly not started

## A19 — Final Clean Validation
From clean checkout/environment run as applicable:

1. install
2. DB start
3. Phase A + Phase B migrations
4. synthetic seed
5. format
6. lint
7. strict typecheck
8. tests
9. security scan
10. license check
11. web/admin/API builds
12. mobile validation/export
13. smoke tests
14. hosted GitHub Actions

**Accept when:** all applicable checks PASS.

# PHASE B ACCEPTANCE CRITERIA

Phase B is COMPLETE only when ALL are true:

- Phase A remains passing.
- Amendment 001 remains intact.
- Knowledge-domain separation is implemented.
- Source registry works.
- Source versions are historical/immutable.
- Source sections and citations work.
- Authorship is separate from provenance.
- Qualifications are separate from source/right concepts.
- Reviewer identities and append-oriented review history work.
- Four-eyes approval capability exists.
- Movement taxonomy is implemented.
- Capability taxonomy is implemented.
- Exercise schema is implemented.
- Demand validation works.
- Formation suitability works.
- Exercise variants/relationships work.
- Equipment catalog works.
- Recovery schema works.
- Media requirements support still sequences.
- Video is optional by default.
- Technical media review is representable.
- Rights records work.
- UNKNOWN rights blocks publication.
- Publication eligibility is server-side.
- Published versions are immutable.
- Supersede/retire preserves history.
- Admin CMS works.
- Admin/editorial authorization works.
- Draft/review content is not public.
- Critical editorial actions are audited.
- Only synthetic fixtures were used.
- No bulk production corpus was imported.
- No Phase C rule/prescription logic was implemented.
- All tests pass.
- Hosted CI passes.
- Documentation reflects reality.

If any criterion fails:

`PHASE B = INCOMPLETE`

# PROHIBITED PHASE B BEHAVIOR

Do not:

- bulk ingest Marine Corps source documents
- import the 100-production-exercise target
- write the final exercise library
- generate exercise photos
- ingest proprietary ISSA courseware
- imply ISSA endorsement
- implement training rules
- implement prescription logic
- implement readiness
- implement adaptive recovery
- implement training load
- implement PFT/CFT scoring
- implement programs
- implement Unit PT
- implement formation management
- implement Live PT
- implement GPS
- implement HealthKit / Health Connect
- implement real billing
- implement AI search
- weaken review/rights gates
- mutate published versions
- allow UNKNOWN-rights publication
- expose drafts publicly
- conflate user roles, subscriptions, and editorial permissions
- claim tests/builds passed unless actually run

# CHANGE CONTROL

If a major content-model ambiguity appears:

1. stop the affected decision
2. document the ambiguity
3. identify impacted migrations/entities/APIs
4. propose the smallest compliant options
5. do not invent product doctrine

Low-level technical decisions may proceed when they do not alter product behavior.

# REQUIRED PHASE B REPORT

When Phase B is complete, STOP. Do not begin Phase B2 or Phase C.

Return exactly these sections:

## PHASE
Phase B — Knowledge Base Foundation

## STATUS
COMPLETE or INCOMPLETE

## INITIAL STATE
What existed before Phase B.

## ARCHITECTURE IMPLEMENTED
Knowledge-base architecture summary.

## DATABASE MIGRATIONS
Names and purposes.

## FILES CREATED
Relevant complete inventory.

## FILES MODIFIED
Relevant complete inventory.

## ADRS
Each new ADR and decision.

## SOURCE REGISTRY
Implemented behavior.

## AUTHORSHIP / QUALIFICATIONS / REVIEWS
Implemented behavior and separation.

## EXERCISE MODEL
Schema, taxonomies, relationships.

## RECOVERY MODEL
Implemented behavior.

## MEDIA MODEL
Confirm still-image-first design, video optional status, and no production-media ingestion.

## RIGHTS / PUBLICATION
Rights gates, review gates, immutability, supersession.

## ADMIN CMS
Screens, workflows, authorization.

## SECURITY / PRIVACY
Controls and known gaps.

## AUDIT
Editorial actions covered.

## TESTS
Tests added.

## TEST RESULTS
Actual commands and results only.

## BUILD RESULTS
Actual results only.

## HOSTED CI
Provider, workflow, branch, commit, run, actual result.

## ACCEPTANCE CRITERIA
Every Phase B criterion marked PASS or FAIL with evidence.

## KNOWN ISSUES
Unresolved items.

## OPEN DECISIONS
Only genuine product-level ambiguities.

## PHASE B2 READINESS
READY or NOT READY.

Then STOP.

# FINAL DIRECTIVE

Implement Formation Zero **Phase B — Knowledge Base Foundation only**.

Build the structure first.

Do not flood the system with production content yet.

The objective is to create a knowledge system that is:

- source-traceable
- versioned
- rights-aware
- authorship-aware
- professionally reviewable
- auditable
- immutable after publication
- safe for future automation
- universal in audience
- consistent with Formation Zero branding and legal boundaries

**Inspect → plan → implement Phase B → test → run hosted CI → document → report → STOP.**
