# Immutable prescription provenance

Pure material IDs/fingerprints are deterministic over the canonical request, complete input and engine version. Arrays are semantically sets or sorted by documented slot/candidate/dose order. No clock or random value participates in material selection.

Service adds a random record UUID and database generated_at timestamp as a persistence envelope. It replaces material/request and Phase C input digests with domain-separated HMAC-SHA256 values using the existing server secret. Raw facts and individual_ref are not copied to the result. Exact rule IDs/versions/citations/reason versions, rule-set ID, Phase C engine version, prescription engine version, template version, content versions and knowledge fingerprint remain in restricted history.

Migration 007 creates prescriptions separate from editorial audit_events. UPDATE, DELETE and TRUNCATE are rejected by database triggers; runtime grants permit only SELECT/INSERT. GET requires current editorial access and matching actor_id. Later content edits, supersession or retirement affect new requests but never rewrite saved JSON/version references. Authorization revocation immediately prevents history access. Current retention is append-only; any future erasure/retention migration requires a separate reviewed design consistent with existing privacy policy.

The full restricted trace may reveal health-related inferences, even without raw facts. It must not be placed in generic logs, analytics or public responses. The public_rationale field is the only public-safe prose, and this phase adds no consumer endpoint.
