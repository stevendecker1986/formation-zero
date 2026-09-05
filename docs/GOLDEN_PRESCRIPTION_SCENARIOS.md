# Golden prescription scenarios

All scenarios use isolated SYNTHETIC-D-CATALOG-V1 software fixtures, not training guidance. Tests are `tests/prescription-engine.test.ts`; actual production boundary and history are additionally tested against PostgreSQL in prescription-api and rule-api tests. The real B2 corpus is imported without promotion.

| #   | Scenario                        | Expected invariant                                          |
| --- | ------------------------------- | ----------------------------------------------------------- |
| 01  | 45-minute general strength      | Required preparation/push/pull/lower/trunk structure fits   |
| 02  | 30-minute no equipment          | No unavailable equipment selected                           |
| 03  | 60-minute muscle development    | Additional lower-body slot                                  |
| 04  | Running allowed                 | Eligible running selected                                   |
| 05  | Running blocked                 | No running prescription                                     |
| 06  | Synthetic rucking               | Pack-supported rucking                                      |
| 07  | YELLOW                          | Phase C dose cap 2                                          |
| 08  | ORANGE                          | Phase C dose cap 1                                          |
| 09  | RED                             | Recovery-only or safe failure                               |
| 10  | Equipment loss                  | Explicit eligible substitution                              |
| 11  | Limited space                   | Large-space running excluded                                |
| 12  | Overhead restriction            | Overhead preference suppressed                              |
| 13  | Jump/high-impact restriction    | Jump excluded                                               |
| 14  | Supplied recent lower-body load | C cap retained                                              |
| 15  | No supervision                  | Technical candidate blocked                                 |
| 16  | Equal-choice preference         | Preference breaks safe tie                                  |
| 17  | Blocked preference              | Cannot restore equipment-blocked candidate                  |
| 18  | Insufficient time               | Mandatory components never truncated                        |
| 19  | No safe content                 | NO_SAFE_PRESCRIPTION                                        |
| 20  | Unpublished B2                  | Production eligibility denial, actual corpus API regression |
| 21  | Repeat                          | Identical material result                                   |
| 22  | Shuffled input                  | Candidates/rules/doses/slots order-independent              |
| 23  | Historical versions             | Prior result immutable; DB supersession regression          |
| 24  | Objective structures            | Running and strength differ                                 |

Additional tests cover all eight failures, mixed-mode isolation, minimum-rest/floor rejection, explicit regression/progression/blocked targets, volume arithmetic, supplied program phase, private explanations, API authorization/forgery and immutable history.
