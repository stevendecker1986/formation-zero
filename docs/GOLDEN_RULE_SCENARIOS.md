# Golden rule scenarios

All inputs, policy identifiers, thresholds, authors and review actions in these tests are explicitly synthetic. They do not certify real training rules. Implementation: tests/rule-engine.test.ts. All 16 scenarios executed successfully during local development; final clean/hosted evidence is in PHASE_C_REPORT.md.

| #   | Scenario                                      | Expected result                                                  |
| --- | --------------------------------------------- | ---------------------------------------------------------------- |
| 1   | No running + running preference               | Restriction blocks; preference suppressed                        |
| 2   | No overhead + overhead candidate              | Blocked                                                          |
| 3   | Supplied soreness/load + demanding lower body | Candidate exceeds cap                                            |
| 4   | RED + strenuous candidate                     | Automatic use withheld                                           |
| 5   | Unavailable equipment                         | Blocked                                                          |
| 6   | Unsafe surface + jump/sprint                  | Both blocked                                                     |
| 7   | High complexity without supervision           | Blocked                                                          |
| 8   | Preference between eligible candidates        | Stable eligible-only ranking                                     |
| 9   | Policy population/effective interval          | Exact inclusive start/exclusive end and population applicability |
| 10  | Non-production-eligible candidate             | Production content gate blocks                                   |
| 11  | Same-priority conflict                        | Restrictive minimum and explicit trace                           |
| 12  | No safe eligible option                       | Valid NO_SAFE_ELIGIBLE_OPTION                                    |
| 13  | 1,000 candidates, repeated/reversed inputs    | Identical material output                                        |
| 14  | P12 resurrection attempt                      | Remains blocked; score suppressed                                |
| 15  | Missing safety fact                           | UNKNOWN withholds use                                            |
| 16  | Unsafe equipment/provider movement exclusion  | Blocked                                                          |

Additional tests cover exact hierarchy, all 13 effects, all condition operators, bounded syntax, invalid fact types, incompatible attribute requirements, privacy, immutability, exact sets, activation, forgery and real pending B2 content. Nineteen seeded rules span all priorities and seven rule types; all INGESTED/synthetic, with no production activation or real approvals.
