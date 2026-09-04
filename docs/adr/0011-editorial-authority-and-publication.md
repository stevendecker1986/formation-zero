# ADR 0011 — Separate editorial grants and publication authority

Status: accepted by explicit owner replies in this task.

PLATFORM_ADMIN manages separate editorial grants. CONTENT_EDITOR authors drafts. Explicitly granted reviewers submit only their review types. PUBLISHER approves, publishes, supersedes and retires. PLATFORM_ADMIN is not an implicit qualified reviewer or publisher. Reviewer identity/type/activity and enabled-account checks supplement grants; credentials alone do not authorize actions. Consumer roles and entitlement tiers remain unchanged.

Exercise/recovery require TECHNICAL, SAFETY, EDITORIAL and RIGHTS. Media require TECHNICAL and RIGHTS. Official policy content additionally requires POLICY. The final approver differs from the author for every published version. The approving publisher performs publication, with gates rechecked. Four-eyes checks include both version creator and linked author account.

No public knowledge endpoints are introduced. PUBLISHED is an internal editorial state, not commercial-launch approval. Existing legal and rights boundaries remain in force.
