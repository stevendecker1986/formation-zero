# Rule priority and conflict resolution

| Priority | Class                   |
| -------- | ----------------------- |
| P0       | SAFETY                  |
| P1       | FUNCTIONAL_RESTRICTIONS |
| P2       | OFFICIAL_POLICY         |
| P3       | EXERCISE_ELIGIBILITY    |
| P4       | READINESS               |
| P5       | RECOVERY_RECENT_LOAD    |
| P6       | PROGRAM_PHASE           |
| P7       | TRAINING_OBJECTIVE      |
| P8       | MOVEMENT_BALANCE        |
| P9       | EQUIPMENT_SPACE         |
| P10      | FORMATION_LOGISTICS     |
| P11      | USER_PREFERENCE         |
| P12      | OPTIMIZATION            |

Higher priority has a smaller number. No effect can clear a block. Requirements add constraints; they are not permissions that cancel other exclusions. Same-key lower-priority limits/attributes are suppressed and traced. Same-priority caps take the restrictive minimum. Incompatible same-priority attributes block rather than arbitrarily granting one. Remaining ties sort by permanent rule ID, version, then canonical effect representation, using code-point comparison rather than locale-dependent sorting.

Scores are a 13-component priority vector, compared from P0 through P12. Equal scores sort by candidate ID. Blocked/review-withheld candidates never appear in ranked_eligible. Preference conditions and SOFT_PREFERENCE rules must be P11; optimization conditions must be P12. No rule can supply an allow/resurrection effect.

Unknown P0–P3 matches block. At other priorities BLOCK blocks; REVIEW withholds automatic use and flags an unknown reason. AND/OR use three-valued logic, allowing a definite false conjunction or true disjunction to resolve without pretending other missing facts were false. All conflicts and suppressions remain visible in the trace.
