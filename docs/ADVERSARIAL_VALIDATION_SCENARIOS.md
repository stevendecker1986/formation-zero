# Adversarial validation scenarios

`tests/validation-engine.test.ts` implements the directive's numbered 30-case mutation suite. It covers Phase C blocks, unpublished B2-shaped content, content/rule/request/artifact tampering, time/rest/intensity/volume, equipment, overhead/high-impact restrictions, RED/ORANGE, relationship direction, duplicates, required sections/recovery, objective/rationale/provenance, client-forged state/policy, retired content, interval arithmetic and supervision.

Every mutation begins with a known-good synthetic Phase D artifact, applies one deliberate defect and asserts `REJECT` plus the expected stable code. Separate PostgreSQL/API cases cover actual pending B2 records, client envelope forgery, immutable history and post-validation upstream invalidation.
