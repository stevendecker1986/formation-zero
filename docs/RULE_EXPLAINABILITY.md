# Explainability and replay

Material output includes deterministic evaluation_id, engine/rule-set/knowledge versions, canonical input hash, explicit as_of, exact rule/citation/reason-version references, final constraints, reason codes, blocked/withheld candidates, eligible ranking and warnings. Each candidate trace lists all considered rules, match/UNKNOWN/date/mode results, priority, effects and suppressions/conflicts. No input facts are echoed.

The API adds record_id and evaluated_at as non-material envelope fields. Repeated identical snapshots produce identical material output; timestamps/record IDs intentionally differ. Sorting candidates, rules, set-like arrays, object keys and effects removes database/input enumeration dependence.

Persisted provenance retains engine/set/knowledge references, exact rule/reason/citation references, content versions, constraint/eligibility results and reason codes. Raw facts are not saved. Its fingerprint is domain-separated HMAC-SHA-256, not an unkeyed hash vulnerable to simple fact guessing. Raw canonical hashes are transient authorized response data only. Generic logs/audit do not contain facts, reason results or hashes.

Reading retained evaluation provenance requires the original evaluating actor and current editorial access; even a different PLATFORM_ADMIN receives NOT_FOUND. The software cannot replay facts it intentionally does not retain. An authorized caller must supply its own appropriately protected original snapshot. Current production boundary checks may change when reviews/rights/status change; those resolved snapshots are part of the engine input, not hidden core state.
