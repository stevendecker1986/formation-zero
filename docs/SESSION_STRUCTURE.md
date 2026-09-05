# Session structure and selection

Reviewed templates specify an objective, exact version, slots, buffer and explicit Phase C exposure-limit units. Slots declare section, required flag, movement/capability alternatives, required tags, content kind and minimum/maximum seconds. Ten section types are supported: PREPARATION, WARM_UP, MOVEMENT_PREP, PRIMARY, SECONDARY, ACCESSORY, CONDITIONING, MOBILITY, COOLDOWN, RECOVERY.

Slots sort by the fixed section order and stable slot ID. Within a section, IDs are the reviewed order; input array order is not meaningful. Required slots are solved before optional slots. Candidate profiles explicitly declare applicable objectives/sections and complete dose options. Preparation profiles must name an upcoming non-recovery movement. Optional content can be omitted with an internal reason, while mandatory slots and minimum rest cannot be deleted to fit.

Ranking: Phase C P0–P10 score vector, avoid repeated movement patterns, requested explicit relationship targets, lower recovery cost, lower technical complexity, P11/P12 scores, explicit preference, emphasis, exact content-version ID, descending work duration and dose ID. Templates enforce required push/pull, lower-body alternatives, trunk and locomotion composition as appropriate. No additional medical thresholds are invented.

Deterministic depth-first matching is bounded to 50,000 search visits. It never duplicates content versions. A failure to construct a complete mandatory composition returns a structured failure; exhausting the bound returns NO_SAFE_PRESCRIPTION. Optional sections are added only when feasible. Unused time is reported, never padded with invented exercise.

Total = work + between-set/interval rest + setup + transition + template buffer. Per-slot minima/maxima and requested duration are enforced. Section totals are derived from assigned lines. Limits running/rucking/impact/upper_body/lower_body are interpreted as aggregate WORK_SECONDS only when the exact reviewed template explicitly declares that unit; ambiguous limits fail REQUIRED_FACT_UNKNOWN. Running/rucking exposure uses matching tags; body/impact exposure uses positive reviewed demand fields.
