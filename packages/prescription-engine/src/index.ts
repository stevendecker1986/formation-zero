import {
  evaluate,
  fingerprint,
  canonical,
  type Evaluation,
} from "@formation-zero/rule-engine";
import {
  constructionSchema,
  sessionSchema,
  SECTIONS,
  type Construction,
  type Dose,
  type Failure,
  type PoolCandidate,
} from "./schemas.js";
export * from "./schemas.js";
export const ENGINE_VERSION = "1.0.0";
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
type Decision = Evaluation["results"][number];
type Option = {
  candidate: PoolCandidate;
  dose: Dose;
  decision: Decision;
  work: number;
  rest: number;
  total: number;
};
const limits = [
  "running",
  "rucking",
  "impact",
  "upper_body",
  "lower_body",
] as const;
export function timing(d: Dose) {
  const v = d.volume;
  const work =
    v.kind === "REPS"
      ? v.sets * v.reps * v.seconds_per_rep
      : v.kind === "TIME"
        ? v.seconds
        : v.kind === "DISTANCE"
          ? v.estimated_seconds
          : v.rounds * v.work_seconds;
  const rests =
    v.kind === "REPS" ? v.sets - 1 : v.kind === "INTERVALS" ? v.rounds - 1 : 0;
  return {
    work,
    rest: rests * d.rest_seconds,
    total:
      work + rests * d.rest_seconds + d.setup_seconds + d.transition_seconds,
  };
}
const exposed = (c: PoolCandidate, key: (typeof limits)[number]) =>
  key === "running" || key === "rucking"
    ? c.content.tags?.includes(key)
    : Number(c.content.demand[key + "_demand"] ?? 0) > 0;
export function prescribe(raw: unknown) {
  const parsed = constructionSchema.safeParse(raw);
  const empty = {
    engine_version: ENGINE_VERSION,
    session: null,
    public_rationale:
      "No candidate session could be constructed within the supplied constraints.",
    internal: {
      base: null as Evaluation | null,
      doses: [] as {
        content_version: string;
        dose_id: string;
        decision: Decision;
      }[],
      omitted_slots: [] as string[],
      notes: [] as string[],
    },
    provenance: null as null | {
      request_fingerprint: string;
      material_fingerprint: string;
      rule_engine_version: string;
      rule_set_version: string;
      rule_versions: Evaluation["rule_versions"];
      knowledge_version: string;
      template_version: string;
      content_versions: string[];
      training_date: string;
    },
  };
  if (!parsed.success)
    return {
      ...empty,
      outcome: "INVALID_REQUEST" as Failure,
      prescription_id: null,
    };
  const input = parsed.data,
    { request: r, template: t } = input;
  const request_fingerprint = fingerprint(r);
  const material_fingerprint = fingerprint({ engine: ENGINE_VERSION, input });
  const output = {
    ...empty,
    prescription_id: "FZ-RX-" + material_fingerprint,
    provenance: {
      request_fingerprint,
      material_fingerprint,
      rule_engine_version: "",
      rule_set_version: input.rule_set_version,
      rule_versions: [] as Evaluation["rule_versions"],
      knowledge_version: input.knowledge_version,
      template_version: t.version_id,
      content_versions: [] as string[],
      training_date: r.training_date,
    },
  };
  const fail = (outcome: Failure, note: string) => {
    output.internal.notes.push(note);
    return { ...output, outcome };
  };
  if (!input.rules.length)
    return fail("RULE_SET_UNAVAILABLE", "No rule set supplied.");
  if (
    !input.rules.some(
      (rule) =>
        rule.effective_from <= r.training_date &&
        (!rule.effective_until || r.training_date < rule.effective_until) &&
        (!rule.population || rule.population === r.facts["policy.population"]),
    )
  )
    return fail(
      "RULE_SET_UNAVAILABLE",
      "No rule is effective for this context.",
    );
  if (
    r.mode === "PRODUCTION"
      ? t.synthetic || !t.production_eligible
      : !t.synthetic
  )
    return fail(
      "CONTENT_NOT_PRODUCTION_ELIGIBLE",
      "Template mode or publication boundary failed.",
    );
  if (
    new Set(input.candidates.map((c) => c.content.id)).size !==
      input.candidates.length ||
    new Set(input.rules.map((x) => x.rule_id)).size !== input.rules.length
  )
    return fail("INVALID_REQUEST", "Duplicate identity.");
  // The explicit equipment/context fields are canonical. Conflicting duplicate facts fail, never relax.
  for (const [key, value] of Object.entries({
    "equipment.available": r.equipment.available,
    "equipment.unsafe": r.equipment.unsafe,
    "environment.space": r.space,
  }))
    if (key in r.facts && canonical(r.facts[key]) !== canonical(value))
      return fail("INVALID_REQUEST", "Conflicting context fields.");
  const facts = {
    ...r.facts,
    "equipment.available": r.equipment.available,
    "equipment.unsafe": r.equipment.unsafe,
    "environment.space": r.space,
  };
  const pool = input.candidates
    .filter(
      (c) =>
        !r.candidate_scope.length ||
        r.candidate_scope.includes(c.content.content_version),
    )
    .sort((a, b) =>
      compare(a.content.content_version, b.content.content_version),
    );
  const base = evaluate({
    mode: r.mode,
    as_of: r.training_date,
    rule_set_version: input.rule_set_version,
    knowledge_version: input.knowledge_version,
    facts,
    candidates: pool.map((c) => c.content),
    rules: input.rules,
  });
  output.internal.base = base;
  output.provenance.rule_engine_version = base.engine_version;
  output.provenance.rule_versions = base.rule_versions;
  if (!pool.length)
    return fail("INSUFFICIENT_ELIGIBLE_CONTENT", "Candidate scope is empty.");
  if (!base.results.some((x) => x.eligible))
    return fail(
      base.warnings.includes("FZ-RSN-REQUIRED-FACT-UNKNOWN")
        ? "REQUIRED_FACT_UNKNOWN"
        : pool.every((c) =>
              r.mode === "PRODUCTION"
                ? c.content.synthetic ||
                  !c.content.production_eligible ||
                  c.content.status !== "PUBLISHED"
                : !c.content.synthetic,
            )
          ? "CONTENT_NOT_PRODUCTION_ELIGIBLE"
          : "NO_SAFE_PRESCRIPTION",
      "Phase C withheld every candidate.",
    );
  const options: Option[] = [];
  let equipmentMissing = false,
    unknown = false;
  for (const c of pool) {
    if (
      !base.results.find((x) => x.content_version === c.content.content_version)
        ?.eligible
    )
      continue;
    if (!c.content.equipment) {
      unknown = true;
      continue;
    }
    if (
      c.content.equipment.some(
        (e) =>
          !r.equipment.available.includes(e) || r.equipment.unsafe.includes(e),
      )
    ) {
      equipmentMissing = true;
      continue;
    }
    if (!c.metadata.objectives.includes(r.objective)) continue;
    for (const original of [...c.metadata.dose_options].sort((a, b) =>
      compare(a.id, b.id),
    )) {
      if (!original.objectives.includes(r.objective)) continue;
      const dose = structuredClone(original);
      if (dose.intensity.mode === "PACE_ZONE") {
        if (!r.intensity_inputs.pace_zone) {
          unknown = true;
          continue;
        }
        dose.intensity.value = r.intensity_inputs.pace_zone;
      }
      if (dose.intensity.mode === "LOAD") {
        if (r.intensity_inputs.load_target_kg === undefined) {
          unknown = true;
          continue;
        }
        dose.intensity.value = r.intensity_inputs.load_target_kg;
      }
      if (dose.intensity.mode === "PERCENTAGE") {
        if (!r.intensity_inputs.one_rm_reference) {
          unknown = true;
          continue;
        }
        dose.intensity.reference = r.intensity_inputs.one_rm_reference;
      }
      const decision = evaluate({
        mode: r.mode,
        as_of: r.training_date,
        rule_set_version: input.rule_set_version,
        knowledge_version: input.knowledge_version,
        facts,
        candidates: [{ ...c.content, intensity: dose.intensity.level }],
        rules: input.rules,
      }).results[0]!;
      output.internal.doses.push({
        content_version: c.content.content_version,
        dose_id: dose.id,
        decision,
      });
      if (
        !decision.eligible ||
        (decision.constraints.recovery && c.kind !== "RECOVERY")
      )
        continue;
      if (
        limits.some((key) => decision.constraints[key] && !t.limit_units[key])
      ) {
        unknown = true;
        continue;
      }
      options.push({ candidate: c, dose, decision, ...timing(dose) });
    }
  }
  const preferredTargets = new Set<string>();
  const relationshipGroups: string[][] = [];
  for (const rel of [...r.relationship_requests].sort((a, b) =>
    compare(canonical(a), canonical(b)),
  )) {
    const source = pool.find(
      (c) => c.content.content_version === rel.from_version,
    );
    const targets =
      source?.relationships
        .filter((e) => e.type === rel.type)
        .map((e) => e.target_version) ?? [];
    const available = targets.filter((id) =>
      options.some((o) => o.candidate.content.content_version === id),
    );
    if (!available.length)
      return fail(
        "NO_SAFE_PRESCRIPTION",
        "Requested explicit relationship has no eligible target.",
      );
    available.forEach((id) => preferredTargets.add(id));
    relationshipGroups.push(available);
  }
  const matches = (o: Option, s: Construction["template"]["slots"][number]) =>
    o.candidate.metadata.sections.includes(s.section) &&
    (s.kind === "ANY" || s.kind === o.candidate.kind) &&
    (!s.movements.length ||
      s.movements.includes(o.candidate.content.movement ?? "")) &&
    (!s.capabilities.length ||
      s.capabilities.includes(o.candidate.content.capability ?? "")) &&
    s.tags.every((tag) => o.candidate.content.tags?.includes(tag)) &&
    o.total >= s.minimum_seconds &&
    o.total <= s.maximum_seconds;
  const slots = [...t.slots].sort(
    (a, b) =>
      SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section) ||
      compare(a.id, b.id),
  );
  const required = slots.filter((s) => s.required);
  if (required.some((s) => !options.some((o) => matches(o, s))))
    return fail(
      unknown
        ? "REQUIRED_FACT_UNKNOWN"
        : equipmentMissing
          ? "REQUIRED_EQUIPMENT_UNAVAILABLE"
          : "INSUFFICIENT_ELIGIBLE_CONTENT",
      "A mandatory slot lacks an eligible dose.",
    );
  const fitsLimits = (selected: Option[]) =>
    limits.every((key) => {
      const caps = selected.flatMap((o) =>
        o.decision.constraints[key]
          ? [Number(o.decision.constraints[key]!.value)]
          : [],
      );
      return (
        !caps.length ||
        selected
          .filter((o) => exposed(o.candidate, key))
          .reduce((n, o) => n + o.work, 0) <= Math.min(...caps)
      );
    });
  const rank = (chosen: Option[]) => (a: Option, b: Option) => {
    for (let p = 0; p <= 10; p++) {
      const diff = b.decision.scores[p]! - a.decision.scores[p]!;
      if (diff) return diff;
    }
    const repeat = (o: Option) =>
      chosen.filter(
        (x) => x.candidate.content.movement === o.candidate.content.movement,
      ).length;
    const diff =
      repeat(a) - repeat(b) ||
      Number(!preferredTargets.has(a.candidate.content.content_version)) -
        Number(!preferredTargets.has(b.candidate.content.content_version)) ||
      Number(a.candidate.content.demand.recovery_cost ?? 0) -
        Number(b.candidate.content.demand.recovery_cost ?? 0) ||
      Number(a.candidate.content.complexity ?? 6) -
        Number(b.candidate.content.complexity ?? 6);
    if (diff) return diff;
    for (let p = 11; p <= 12; p++) {
      const score = b.decision.scores[p]! - a.decision.scores[p]!;
      if (score) return score;
    }
    return (
      Number(!r.preferences.includes(a.candidate.content.content_version)) -
        Number(!r.preferences.includes(b.candidate.content.content_version)) ||
      Number(!r.emphasis.includes(a.candidate.content.movement ?? "")) -
        Number(!r.emphasis.includes(b.candidate.content.movement ?? "")) ||
      compare(
        a.candidate.content.content_version,
        b.candidate.content.content_version,
      ) ||
      b.work - a.work ||
      compare(a.dose.id, b.dose.id)
    );
  };
  const related = (selection: Option[]) =>
    selection.every(
      (o) =>
        !o.candidate.metadata.prepares_movements.length ||
        selection.some(
          (main) =>
            main !== o &&
            main.candidate.kind !== "RECOVERY" &&
            !main.candidate.metadata.prepares_movements.length &&
            o.candidate.metadata.prepares_movements.includes(
              main.candidate.content.movement ?? "",
            ),
        ),
    );
  let visits = 0;
  const search = (
    index: number,
    selected: Option[],
    time: number,
  ): Option[] | null => {
    if (++visits > 50000) return null; // Bounded deterministic failure, never relaxed constraints.
    if (index === required.length)
      return related(selected) &&
        relationshipGroups.every((ids) =>
          selected.some((o) =>
            ids.includes(o.candidate.content.content_version),
          ),
        )
        ? selected
        : null;
    for (const o of options
      .filter(
        (o) =>
          matches(o, required[index]!) &&
          !selected.some(
            (x) =>
              x.candidate.content.content_version ===
              o.candidate.content.content_version,
          ),
      )
      .sort(rank(selected))) {
      if (time + o.total > r.duration_seconds || !fitsLimits([...selected, o]))
        continue;
      const found = search(index + 1, [...selected, o], time + o.total);
      if (found) return found;
    }
    return null;
  };
  const selected = search(0, [], t.buffer_seconds);
  if (!selected)
    return fail(
      visits > 50000 ? "NO_SAFE_PRESCRIPTION" : "INSUFFICIENT_TIME",
      "No complete mandatory composition fits the budget and constraints.",
    );
  const assigned = required.map((s, i) => ({ slot: s, option: selected[i]! }));
  for (const slot of slots.filter((s) => !s.required)) {
    const option = options
      .filter(
        (o) =>
          matches(o, slot) &&
          !selected.some(
            (x) =>
              x.candidate.content.content_version ===
              o.candidate.content.content_version,
          ) &&
          selected.reduce((n, x) => n + x.total, t.buffer_seconds) + o.total <=
            r.duration_seconds &&
          fitsLimits([...selected, o]) &&
          related([...selected, o]),
      )
      .sort(rank(selected))[0];
    if (option) {
      selected.push(option);
      assigned.push({ slot, option });
    } else output.internal.omitted_slots.push(slot.id);
  }
  const lines = assigned
    .sort(
      (a, b) =>
        SECTIONS.indexOf(a.slot.section) - SECTIONS.indexOf(b.slot.section) ||
        compare(a.slot.id, b.slot.id),
    )
    .map(({ slot, option: o }) => ({
      slot_id: slot.id,
      section: slot.section,
      content_version: o.candidate.content.content_version,
      candidate_id: o.candidate.content.id,
      dose: o.dose,
      work_seconds: o.work,
      rest_total_seconds: o.rest,
      total_seconds: o.total,
      selection_reasons: [
        "PHASE_C_ELIGIBLE",
        "REVIEWED_SLOT_MATCH",
        ...(preferredTargets.has(o.candidate.content.content_version)
          ? ["EXPLICIT_RELATIONSHIP"]
          : []),
        ...(r.preferences.includes(o.candidate.content.content_version)
          ? ["PREFERENCE_TIEBREAK"]
          : []),
      ],
    }));
  const total = lines.reduce((n, l) => n + l.total_seconds, t.buffer_seconds);
  const session = sessionSchema.parse({
    objective: r.objective,
    lines,
    sections: SECTIONS.filter((s) => lines.some((l) => l.section === s)).map(
      (section) => ({
        section,
        total_seconds: lines
          .filter((l) => l.section === section)
          .reduce((n, l) => n + l.total_seconds, 0),
      }),
    ),
    buffer_seconds: t.buffer_seconds,
    total_seconds: total,
    unused_seconds: r.duration_seconds - total,
  });
  // Construction assertions are local to generation; no independent validation endpoint is implemented.
  if (
    new Set(lines.map((l) => l.content_version)).size !== lines.length ||
    !selected.every((o) => o.decision.eligible) ||
    !required.every((s) => lines.some((l) => l.slot_id === s.id))
  )
    return fail("NO_SAFE_PRESCRIPTION", "Construction invariant failed.");
  output.provenance.content_versions = lines
    .map((l) => l.content_version)
    .sort(compare);
  return {
    ...output,
    outcome: "CANDIDATE_SESSION" as const,
    session,
    public_rationale:
      "Candidate session assembled for the requested objective using eligible content, the required structure and the supplied time budget. Independent validation has not been performed.",
  };
}
export type Prescription = ReturnType<typeof prescribe>;
