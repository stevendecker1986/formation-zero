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

Only synthetic fixture identities and metadata are shipped. No additional health, location, fitness session, unit, rank or biometric information is collected. Version history is retained for traceability; public distribution and production retention/deletion policy are not introduced. Before collecting real personal editorial evidence in Phase B2, use data minimization and the existing privacy process.
