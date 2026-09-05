# Rule review, versions and activation

RULE, REASON_CODE and RULE_SET use existing knowledge creation/new-version/review/transition endpoints and admin collection forms. CONTENT_EDITOR writes/submits; explicit qualified reviewer grants submit their review types; PUBLISHER approves/publishes/supersedes/retires and explicitly activates production sets. PLATFORM_ADMIN manages grants but gains no implicit publisher authority. Independent final approver remains required.

Every rule-bearing version requires TECHNICAL, SAFETY, EDITORIAL and RIGHTS review; official provenance adds POLICY. Sources, rights and restriction prerequisites retain their existing gates. Rules additionally require a published eligible reason version. Sets require published eligible exact rule versions and matching synthetic identity. Synthetic identity cannot be changed on a new version of the same entity.

Published payloads never change. Superseding creates a new version then explicitly links the old published version to its published successor. Retirement is terminal and audited. Sets do not follow newer rule versions; activation appends an immutable event referencing an exact published non-synthetic set. Evaluations revalidate it; superseded/retired/invalidated rules disable further production evaluation until an eligible set is explicitly activated.

Endpoints under authenticated /api/v1/knowledge:

- Existing records, versions, reviews, transitions, provenance and rights routes cover all three new kinds.
- GET/POST rule-activations inspect history / explicitly activate (POST requires PUBLISHER).
- POST rule-evaluations accepts TEST with exact synthetic set and candidate snapshots, or PRODUCTION with facts and candidate version UUIDs only. Production set and statuses come from the server.
- GET rule-evaluations/:id returns minimized provenance only to its evaluating actor with current editorial access.

The CMS includes activation controls, history, validated JSON evaluation and an explainability result panel. Test seeding is LOCAL/TEST only, idempotent, disabled-principal-owned, with UNKNOWN rights and zero reviews. No initial production library or set is shipped. Pending B2 records are never promoted.
