# Rule conditions and effects

Conditions: EQ, NE, HAS, GT, GTE, LT, LTE, inclusive RANGE, AND, OR, NOT, EXISTS, MISSING and EQUIPMENT_AVAILABLE. Paths are allowlisted; arbitrary expressions, prototype paths, functions and executable database code are rejected. Wrong comparison types yield UNKNOWN; invalid fact types fail request validation. EXISTS/MISSING test knownness, not JavaScript truthiness. Equipment availability requires every candidate item present and absent from the unsafe list; a known empty requirement is available.

Candidate fields cover status, movement/capability, tags, equipment, restrictions, environment, complexity, intensity, supervision and demand dimensions. Facts cover the six allowed functional constraints, explicit excluded movements, safety, supplied readiness/load, phase/objective, movement exposure, equipment/space, formation and preferences. New content rule_metadata participates in normal version/review gates.

| Effect                         | Behavior                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| BLOCK_CANDIDATE                | Irreversible exclusion                                         |
| REQUIRE_ATTRIBUTE              | Exact required value; missing/mismatch excludes                |
| EXCLUDE_TAG / REQUIRE_TAG      | Constrain eligibility; unknown tags exclude                    |
| MODIFY_LIMIT                   | Priority-owned upper bound, emitted without prescribing volume |
| CAP_INTENSITY / CAP_COMPLEXITY | Upper bound; unknown or excessive candidate value excludes     |
| REQUIRE_RECOVERY               | Emits a requirement; does not select recovery content          |
| ADD_REASON                     | Adds the rule's static reason                                  |
| SCORE_UP / SCORE_DOWN          | Adjust priority score only while otherwise eligible            |
| FLAG_REVIEW                    | Withholds automatic use                                        |
| NO_AUTOMATIC_PRESCRIPTION      | Withholds automatic use                                        |

Rule types: HARD_BLOCK, REQUIREMENT, MODIFICATION, ELIGIBILITY, SOFT_PREFERENCE, SCORE_ADJUSTMENT, INFORMATIONAL. HARD_BLOCK must contain BLOCK_CANDIDATE. Effects are typed; rule type describes editorial intent and does not permit bypassing effect semantics. No effect builds sets/reps/durations, sessions or programs. All fixture numeric values are synthetic software tests, not approved thresholds.
