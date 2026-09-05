# Prescription explainability

Public rationale is a concise static statement that an eligible candidate session was assembled for the requested objective, structure and time budget, or could not be constructed. It never includes raw facts, readiness/load values, identity or medical assertions. Independent validation has not occurred.

Restricted internal result contains Phase C base decisions/reasons, dose decisions and constraints, omitted optional slots, failure notes, selected exact versions, explicit relationship/preference reason codes and timing. Base and dose traces explain important exclusions and supplied readiness/load/phase effects without copying raw input facts. Selection codes: PHASE_C_ELIGIBLE, REVIEWED_SLOT_MATCH, EXPLICIT_RELATIONSHIP and PREFERENCE_TIEBREAK. Template version and slot constraints explain structure choice.

Eight structured failures: NO_SAFE_PRESCRIPTION, INSUFFICIENT_ELIGIBLE_CONTENT, INSUFFICIENT_TIME, REQUIRED_EQUIPMENT_UNAVAILABLE, REQUIRED_FACT_UNKNOWN, CONTENT_NOT_PRODUCTION_ELIGIBLE, RULE_SET_UNAVAILABLE, INVALID_REQUEST. Failure results have no session. HTTP malformed/forged envelopes receive existing strict 400 errors; inaccessible records receive 404 and unauthorized users 401/403. No failure relaxes a gate.
