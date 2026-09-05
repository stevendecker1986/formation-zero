# Phase B data classification supplement

Baseline: [PRIVACY_DATA_CLASSIFICATION.md](../PRIVACY_DATA_CLASSIFICATION.md).

| Data                                            | Classification and handling                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Author name, role, optional public affiliation  | Editorial personal data; authenticated only in Phase B                        |
| Account linkage, reviewer identity/grants       | Internal restricted metadata, not consumer profile fields                     |
| Credential identifiers                          | Private, excluded from normal API responses; collect only if necessary        |
| Reviewer comments, qualification evidence notes | Internal restricted; no public read endpoint                                  |
| Sources, exercise/recovery/media metadata       | Editorial draft/history; internal even when PUBLISHED                         |
| Rights/license evidence                         | Internal editorial evidence, not an inferred legal authorization              |
| Audit metadata                                  | Internal append-only identifiers/reasons; no content/credential values logged |

B2 adds unpublished candidate content and owner-reported qualification metadata under the same editorial boundaries. Phase C accepts health-adjacent facts transiently for restricted editorial evaluation; it does not add consumer profile, session, location or biometric collection. Public distribution and a production retention/deletion policy are not introduced.

## Phase C

| Data                                         | Classification and handling                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Safety/restriction/readiness/load fact input | Sensitive health-adjacent; transient request memory only; not in logs or persisted snapshots |
| Evaluation result/constraints/reason codes   | Potential health-adjacent inference; restricted evaluation provenance, evaluating actor only |
| Raw input hash / full trace                  | Transient authenticated response; not generic audit/log data                                 |
| Stored HMAC fingerprint                      | Restricted provenance; domain separated and keyed; not analytics                             |
| Rule/source/reason/set version references    | Immutable editorial provenance                                                               |
| Generic activation/evaluation audit          | IDs/counts only; no facts, hashes or results                                                 |

Only synthetic evaluation examples are shipped. No production rule set is activated. Controlled validation does not authorize collecting real health data or establish production retention policy. Replaying requires a separately protected caller-held input; the service intentionally cannot reconstruct facts from retained provenance.
