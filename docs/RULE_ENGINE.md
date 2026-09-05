# Deterministic rule engine

`packages/rule-engine` contains schemas, conditions, effects and pure evaluation. It has no React, Next, Expo, HTTP or database dependencies. `schemas` is browser-safe; evaluation uses Node SHA-256. Engine version is 1.0.0.

`evaluate(input)` consumes mode, explicit as_of, exact rule-set/knowledge versions, typed facts, candidate snapshots and exact rule versions. It returns constraints, blocked/eligible candidates, stable reasons, warnings and a considered/matched/suppressed trace. Eligible candidates may be ranked lexicographically by priority score; none is selected for a workout. NO_SAFE_ELIGIBLE_OPTION is valid.

Facts use explicit dotted keys. Missing, null and UNKNOWN are unknown. Supplied readiness supports GREEN/YELLOW/ORANGE/RED and reason facts. Load supports 24h/72h/7d/28d running, rucking, impact, lower/upper body, high intensity, aerobic and anaerobic values; no load/readiness calculation occurs. Program phase and objective enums reflect the directive, with no program/session implementation.

Production entry is the authenticated editorial API, not direct client-supplied snapshots. It resolves exact active rules and knowledge metadata while holding the existing editorial lock, then checks lifecycle/reviews/rights and passes the snapshot to the evaluator. Unknown rule_metadata remains unknown. Draft or stale references invalidate production evaluation. Caller-supplied as_of is an explicit scenario date; this endpoint does not authorize an automatic prescription at any date.

Limits: 100 rules, 1,000 candidates, 20 effects per rule, bounded declarative trees, existing HTTP body/rate limits. Canonical sorting handles database order independence. No random selection, current-time lookup, optimizer search, prescription, medical diagnosis, scoring system or Phase D behavior exists.
