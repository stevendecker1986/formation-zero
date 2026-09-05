# Stable reason registry

Persisted reason entities receive permanent FZ-RSN numeric IDs from the existing monotonic code sequence. New versions preserve that ID; unrelated meaning requires a new entity. Rule IDs use FZ-RULE and set IDs FZ-RSET. IDs are never recycled. Golden fixtures have explicit FZ-RSN-SYNTHETIC codes; seeded fixtures receive database IDs and are linked by exact version.

Each reason has category, static safe explanation, severity and immutable version. Rules reference the exact reason version; rule-set and evaluation provenance preserve that reference. No explanation interpolates facts. Rule/reason edits, reviews, approval, publication and retirement are audited. Priority and reason-reference changes additionally emit explicit audit events.

Engine-owned invariant codes (engine version 1.0.0):

| Code                         | Meaning                                              |
| ---------------------------- | ---------------------------------------------------- |
| FZ-RSN-CONTENT-NOT-ELIGIBLE  | Production content gates not satisfied               |
| FZ-RSN-TEST-ISOLATION        | Non-synthetic candidate supplied to test mode        |
| FZ-RSN-RULE-SET-UNAVAILABLE  | No validated rules supplied                          |
| FZ-RSN-RULE-NOT-ELIGIBLE     | Rule does not satisfy evaluation mode                |
| FZ-RSN-REQUIRED-FACT-UNKNOWN | Missing required information withholds automatic use |
| FZ-RSN-CANDIDATE-EXCEEDS-CAP | Candidate metadata cannot satisfy an applicable cap  |

Editorial explanations are internal and review-gated. No public clinical explanation or marketing telemetry is introduced.
