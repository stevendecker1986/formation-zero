import { createHash, createHmac } from "node:crypto";
import { canonical, evaluate } from "@formation-zero/rule-engine";
import {
  CATEGORIES,
  SECTIONS,
  validationInputSchema,
  type Finding,
  type IndependentDose,
  type ValidationInput,
} from "./schemas.js";
export * from "./schemas.js";
export const ENGINE_VERSION = "1.0.0";

type Definition = Omit<Finding, "references">;
const define = (
  code: string,
  category: Finding["category"],
  blocking: boolean,
  internal_explanation: string,
  public_explanation: string,
): Definition => ({
  code,
  version: 1,
  status: "ACTIVE",
  category,
  severity: blocking ? "BLOCK" : "WARNING",
  blocking,
  internal_explanation,
  public_explanation,
});
export const CODES = {
  "FZ-VAL-STRUCTURE-001": define(
    "FZ-VAL-STRUCTURE-001",
    "STRUCTURE",
    true,
    "Prescription structure is malformed or incomplete.",
    "The session structure could not be verified.",
  ),
  "FZ-VAL-STRUCTURE-002": define(
    "FZ-VAL-STRUCTURE-002",
    "STRUCTURE",
    true,
    "A required template slot or section is missing or invalid.",
    "A required session component is missing.",
  ),
  "FZ-VAL-STRUCTURE-090": define(
    "FZ-VAL-STRUCTURE-090",
    "STRUCTURE",
    false,
    "An optional reviewed template slot is omitted.",
    "An optional session component was not included.",
  ),
  "FZ-VAL-SAFETY-001": define(
    "FZ-VAL-SAFETY-001",
    "SAFETY",
    true,
    "Phase C blocked or withheld a selected candidate or dose.",
    "The session conflicts with an applicable safety constraint.",
  ),
  "FZ-VAL-RESTRICTION-001": define(
    "FZ-VAL-RESTRICTION-001",
    "FUNCTIONAL_RESTRICTION",
    true,
    "A selected item conflicts with supplied restrictions.",
    "The session conflicts with an applicable restriction.",
  ),
  "FZ-VAL-POLICY-001": define(
    "FZ-VAL-POLICY-001",
    "POLICY",
    true,
    "An applicable policy rule was not satisfied.",
    "The session does not satisfy an applicable policy requirement.",
  ),
  "FZ-VAL-CONTENT-001": define(
    "FZ-VAL-CONTENT-001",
    "CONTENT_ELIGIBILITY",
    true,
    "An exact content/template version is absent or not eligible for this mode.",
    "Required content eligibility could not be verified.",
  ),
  "FZ-VAL-RIGHTS-001": define(
    "FZ-VAL-RIGHTS-001",
    "RIGHTS_PUBLICATION",
    true,
    "Publication, reviews, current-version or rights eligibility failed.",
    "Required publication and rights checks did not pass.",
  ),
  "FZ-VAL-DOSE-001": define(
    "FZ-VAL-DOSE-001",
    "DOSE",
    true,
    "Dose shape, bounds or authoritative profile does not match.",
    "A prescribed dose could not be verified.",
  ),
  "FZ-VAL-DOSE-002": define(
    "FZ-VAL-DOSE-002",
    "DOSE",
    true,
    "Dose violates an applicable Phase C cap/floor or lacks a supplied interface value.",
    "A prescribed intensity exceeds an applicable limit or lacks required information.",
  ),
  "FZ-VAL-TIME-001": define(
    "FZ-VAL-TIME-001",
    "TIME",
    true,
    "Stored work/rest/item/section/total arithmetic differs from independent recalculation.",
    "Session timing could not be verified.",
  ),
  "FZ-VAL-TIME-002": define(
    "FZ-VAL-TIME-002",
    "TIME",
    true,
    "Recalculated duration exceeds the authorized duration.",
    "The session exceeds its authorized duration.",
  ),
  "FZ-VAL-TIME-003": define(
    "FZ-VAL-TIME-003",
    "TIME",
    true,
    "Rest, setup, transition or buffer is negative or below an authoritative minimum.",
    "Required timing safeguards are not satisfied.",
  ),
  "FZ-VAL-MOVEMENT-001": define(
    "FZ-VAL-MOVEMENT-001",
    "MOVEMENT_COMPOSITION",
    true,
    "A slot mismatch, duplicate item, preparation mismatch or explicit composition requirement exists.",
    "The session composition could not be verified.",
  ),
  "FZ-VAL-DEMAND-001": define(
    "FZ-VAL-DEMAND-001",
    "DEMAND",
    true,
    "An explicit aggregate demand/exposure cap is exceeded.",
    "The session exceeds an applicable demand limit.",
  ),
  "FZ-VAL-EQUIPMENT-001": define(
    "FZ-VAL-EQUIPMENT-001",
    "EQUIPMENT",
    true,
    "Required equipment is absent or marked unsafe.",
    "Required safe equipment is unavailable.",
  ),
  "FZ-VAL-ENVIRONMENT-001": define(
    "FZ-VAL-ENVIRONMENT-001",
    "SPACE_ENVIRONMENT",
    true,
    "Space, surface or environment metadata conflicts with supplied context.",
    "The session does not fit the supplied environment.",
  ),
  "FZ-VAL-READINESS-001": define(
    "FZ-VAL-READINESS-001",
    "READINESS",
    true,
    "Selected work conflicts with Phase C readiness effects.",
    "The session conflicts with the supplied readiness state.",
  ),
  "FZ-VAL-LOAD-001": define(
    "FZ-VAL-LOAD-001",
    "RECENT_LOAD",
    true,
    "Selected work conflicts with Phase C recent-load effects.",
    "The session conflicts with supplied recent-load constraints.",
  ),
  "FZ-VAL-PHASE-001": define(
    "FZ-VAL-PHASE-001",
    "PROGRAM_PHASE",
    true,
    "Selected work conflicts with Phase C program-phase effects.",
    "The session conflicts with the supplied program phase.",
  ),
  "FZ-VAL-OBJECTIVE-001": define(
    "FZ-VAL-OBJECTIVE-001",
    "OBJECTIVE_ALIGNMENT",
    true,
    "Request, template, session, slot or dose objective does not align.",
    "The session does not align with its requested objective.",
  ),
  "FZ-VAL-RELATIONSHIP-001": define(
    "FZ-VAL-RELATIONSHIP-001",
    "SUBSTITUTION_RELATIONSHIP",
    true,
    "Relationship direction/version or documented matching basis is invalid.",
    "A prescribed alternative could not be verified.",
  ),
  "FZ-VAL-SUPERVISION-001": define(
    "FZ-VAL-SUPERVISION-001",
    "SUPERVISION_COMPLEXITY",
    true,
    "A supervision-required item is selected without supplied supervision.",
    "Required supervision is unavailable.",
  ),
  "FZ-VAL-PROVENANCE-001": define(
    "FZ-VAL-PROVENANCE-001",
    "PROVENANCE",
    true,
    "Required exact provenance or version reference is missing/mismatched.",
    "Session provenance could not be verified.",
  ),
  "FZ-VAL-PROVENANCE-002": define(
    "FZ-VAL-PROVENANCE-002",
    "PROVENANCE",
    true,
    "A keyed request/input/artifact fingerprint or prescription ID does not match.",
    "Session integrity could not be verified.",
  ),
  "FZ-VAL-EXPLAIN-001": define(
    "FZ-VAL-EXPLAIN-001",
    "EXPLAINABILITY",
    true,
    "Public rationale or restricted explanation materially contradicts the artifact.",
    "The session explanation is inconsistent.",
  ),
  "FZ-VAL-INTERNAL-001": define(
    "FZ-VAL-INTERNAL-001",
    "INTERNAL_CONSISTENCY",
    true,
    "The artifact contains selected/blocked or other internal contradictions.",
    "The session contains conflicting information.",
  ),
  "FZ-VAL-PRIVACY-001": define(
    "FZ-VAL-PRIVACY-001",
    "PRIVACY_SECURITY",
    true,
    "Sensitive raw facts appear in public-safe output.",
    "The public explanation contains restricted detail.",
  ),
  "FZ-VAL-POLICY-AVAILABLE-001": define(
    "FZ-VAL-POLICY-AVAILABLE-001",
    "POLICY",
    true,
    "Validation policy is absent, inactive, ineligible or mode-incompatible.",
    "An authorized validation policy is unavailable.",
  ),
} as const;
export type ValidationCode = keyof typeof CODES;

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export const keyedFingerprint = (
  secret: string,
  value: unknown,
  domain = "formation-zero-prescription-v1",
) =>
  createHmac("sha256", secret)
    .update(domain + ":" + canonical(value))
    .digest("hex");
export function independentTiming(dose: IndependentDose) {
  const volume = dose.volume;
  let work = 0;
  let recoveries = 0;
  if (volume.kind === "REPS") {
    work = volume.sets * volume.reps * volume.seconds_per_rep;
    recoveries = volume.sets - 1;
  } else if (volume.kind === "TIME") work = volume.seconds;
  else if (volume.kind === "DISTANCE") work = volume.estimated_seconds;
  else {
    work = volume.rounds * volume.work_seconds;
    recoveries = volume.rounds - 1;
  }
  const rest = recoveries * dose.rest_seconds;
  return {
    work,
    rest,
    total: work + rest + dose.setup_seconds + dose.transition_seconds,
  };
}
const normalizeRules = (rules: ValidationInput["rules"]) =>
  [...rules]
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        compare(a.rule_id, b.rule_id) ||
        compare(a.version_id, b.version_id),
    )
    .map((r) => ({
      rule_id: r.rule_id,
      version: r.version,
      version_id: r.version_id,
      provenance: r.provenance,
      citations: [...r.citations].sort(compare),
      reason_code: r.reason.code,
      reason_version_id: r.reason_version_id,
      effective_from: r.effective_from,
      effective_until: r.effective_until,
    }));
const exposureKeys = [
  "running",
  "rucking",
  "impact",
  "upper_body",
  "lower_body",
] as const;
export function validate(raw: unknown, secret: string) {
  const parsed = validationInputSchema.safeParse(raw);
  const findings: Finding[] = [];
  const add = (code: ValidationCode, references: string[] = []) => {
    if (
      !findings.some(
        (f) =>
          f.code === code && canonical(f.references) === canonical(references),
      )
    )
      findings.push({
        ...CODES[code],
        references: [...references].sort(compare),
      });
  };
  const checks = [...CATEGORIES];
  if (!parsed.success) {
    const provenanceError = parsed.error.issues.some(
      (i) => i.path[0] === "prescription" && i.path[1] === "provenance",
    );
    add(provenanceError ? "FZ-VAL-PROVENANCE-001" : "FZ-VAL-STRUCTURE-001");
    return finish(null, findings, ["STRUCTURE", "PROVENANCE"]);
  }
  const input = parsed.data;
  const { prescription: rx, request, template, policy } = input;
  if (
    request.mode === "PRODUCTION"
      ? policy.synthetic ||
        policy.status !== "ACTIVE" ||
        !policy.production_eligible
      : !policy.synthetic || policy.status !== "TEST_ONLY"
  )
    add("FZ-VAL-POLICY-AVAILABLE-001");
  if (rx.outcome !== "CANDIDATE_SESSION" || !rx.session || !rx.prescription_id)
    add("FZ-VAL-STRUCTURE-001");
  if (!rx.session) {
    if (request.mode === "PRODUCTION")
      for (const version of request.candidate_scope) {
        const candidate = input.candidates.find(
          (value) => value.content.content_version === version,
        );
        const authority = input.authority.content[version];
        if (
          !candidate ||
          !authority?.published ||
          !authority.production_eligible
        )
          add("FZ-VAL-CONTENT-001", [version]);
        if (
          !authority?.rights_eligible ||
          !authority.reviews_eligible ||
          !authority.current_for_new_use
        )
          add("FZ-VAL-RIGHTS-001", [version]);
      }
    return finish(input, findings, checks);
  }
  const session = rx.session;
  if (
    !policy.allowed_prescription_engines.includes(rx.engine_version) ||
    !rx.provenance ||
    !policy.allowed_rule_engines.includes(
      rx.provenance?.rule_engine_version ?? "",
    )
  )
    add("FZ-VAL-PROVENANCE-001");
  if (!rx.provenance) return finish(input, findings, checks);
  const expectedInput = {
    request,
    candidates: input.candidates,
    template,
    rules: input.rules,
    rule_set_version: input.rule_set_version,
    knowledge_version: input.knowledge_version,
  };
  const expectedInputFingerprint = keyedFingerprint(secret, expectedInput);
  if (
    input.stored_input_fingerprint !== expectedInputFingerprint ||
    rx.provenance.material_fingerprint !== expectedInputFingerprint ||
    rx.provenance.request_fingerprint !== keyedFingerprint(secret, request) ||
    rx.prescription_id !== "FZ-RX-" + expectedInputFingerprint ||
    input.stored_artifact_fingerprint !==
      keyedFingerprint(secret, rx, "formation-zero-prescription-artifact-v1")
  )
    add("FZ-VAL-PROVENANCE-002");
  const versions = session.lines.map((l) => l.content_version).sort(compare);
  if (
    rx.provenance.rule_set_version !== input.rule_set_version ||
    rx.provenance.knowledge_version !== input.knowledge_version ||
    rx.provenance.template_version !== template.version_id ||
    rx.provenance.training_date !== request.training_date ||
    canonical(rx.provenance.content_versions) !== canonical(versions) ||
    canonical(rx.provenance.rule_versions) !==
      canonical(normalizeRules(input.rules))
  )
    add("FZ-VAL-PROVENANCE-001");
  if (
    session.objective !== request.objective ||
    template.objective !== request.objective
  )
    add("FZ-VAL-OBJECTIVE-001");
  if (
    request.mode === "PRODUCTION" &&
    (!input.authority.template.published ||
      !input.authority.template.production_eligible ||
      template.synthetic ||
      !template.production_eligible)
  )
    add("FZ-VAL-CONTENT-001", [template.version_id]);
  const facts = {
    ...request.facts,
    "equipment.available": request.equipment.available,
    "equipment.unsafe": request.equipment.unsafe,
    "environment.space": request.space,
  };
  const candidateByVersion = new Map(
    input.candidates.map((c) => [c.content.content_version, c]),
  );
  const lineIds = new Set<string>();
  const slotIds = new Set<string>();
  const decisions: {
    line: (typeof session.lines)[number];
    candidate: (typeof input.candidates)[number];
    decision: ReturnType<typeof evaluate>["results"][number];
    work: number;
  }[] = [];
  let independentTotal = template.buffer_seconds;
  if (
    session.buffer_seconds !== template.buffer_seconds ||
    session.buffer_seconds < 0
  )
    add("FZ-VAL-TIME-003");
  for (const line of session.lines) {
    if (lineIds.has(line.content_version) || slotIds.has(line.slot_id))
      add("FZ-VAL-MOVEMENT-001", [line.content_version]);
    lineIds.add(line.content_version);
    slotIds.add(line.slot_id);
    const candidate = candidateByVersion.get(line.content_version);
    const slot = template.slots.find((s) => s.id === line.slot_id);
    if (!candidate || line.candidate_id !== candidate?.content.id) {
      add("FZ-VAL-CONTENT-001", [line.content_version]);
      continue;
    }
    if (
      !slot ||
      slot.section !== line.section ||
      !candidate.metadata.sections.includes(line.section) ||
      (slot.kind !== "ANY" && slot.kind !== candidate.kind) ||
      (slot.movements.length > 0 &&
        !slot.movements.includes(candidate.content.movement ?? "")) ||
      (slot.capabilities.length > 0 &&
        !slot.capabilities.includes(candidate.content.capability ?? "")) ||
      !slot.tags.every((tag) => candidate.content.tags?.includes(tag))
    )
      add("FZ-VAL-STRUCTURE-002", [line.slot_id]);
    if (
      !candidate.metadata.objectives.includes(request.objective) ||
      !line.dose.objectives.includes(request.objective)
    )
      add("FZ-VAL-OBJECTIVE-001", [line.content_version]);
    const authoritativeDose = candidate.metadata.dose_options.find(
      (d) => d.id === line.dose.id,
    );
    const suppliedDose = authoritativeDose
      ? structuredClone(authoritativeDose)
      : null;
    if (suppliedDose?.intensity.mode === "PACE_ZONE")
      suppliedDose.intensity.value = request.intensity_inputs.pace_zone ?? null;
    if (suppliedDose?.intensity.mode === "LOAD")
      suppliedDose.intensity.value =
        request.intensity_inputs.load_target_kg ?? null;
    if (suppliedDose?.intensity.mode === "PERCENTAGE")
      suppliedDose.intensity.reference =
        request.intensity_inputs.one_rm_reference ?? null;
    const d = line.dose,
      v = d.volume;
    const positive =
      v.kind === "REPS"
        ? Number.isInteger(v.sets) &&
          v.sets > 0 &&
          Number.isInteger(v.reps) &&
          v.reps > 0 &&
          Number.isInteger(v.seconds_per_rep) &&
          v.seconds_per_rep > 0
        : v.kind === "TIME"
          ? v.seconds > 0
          : v.kind === "DISTANCE"
            ? v.meters > 0 && v.estimated_seconds > 0
            : Number.isInteger(v.rounds) && v.rounds > 0 && v.work_seconds > 0;
    if (
      !positive ||
      d.intensity.level < 0 ||
      d.intensity.level > 5 ||
      (d.intensity.mode === "RPE" &&
        (typeof d.intensity.value !== "number" ||
          d.intensity.value < 0 ||
          d.intensity.value > 10)) ||
      (d.intensity.mode === "PERCENTAGE" &&
        (typeof d.intensity.value !== "number" ||
          d.intensity.value < 0 ||
          d.intensity.value > 100 ||
          !d.intensity.reference)) ||
      (d.intensity.mode === "PACE_ZONE" &&
        !request.intensity_inputs.pace_zone) ||
      (d.intensity.mode === "LOAD" &&
        request.intensity_inputs.load_target_kg === undefined) ||
      !suppliedDose ||
      canonical(suppliedDose) !== canonical(d) ||
      d.intensity.level < Number(candidate.content.intensity)
    )
      add("FZ-VAL-DOSE-001", [line.content_version]);
    const time = independentTiming(d);
    if (
      [
        d.rest_seconds,
        d.minimum_rest_seconds,
        d.setup_seconds,
        d.transition_seconds,
        time.work,
        time.rest,
        time.total,
      ].some((n) => !Number.isFinite(n) || n < 0) ||
      d.rest_seconds < d.minimum_rest_seconds
    )
      add("FZ-VAL-TIME-003", [line.content_version]);
    if (
      line.work_seconds !== time.work ||
      line.rest_total_seconds !== time.rest ||
      line.total_seconds !== time.total
    )
      add("FZ-VAL-TIME-001", [line.content_version]);
    if (
      slot &&
      (time.total < slot.minimum_seconds || time.total > slot.maximum_seconds)
    )
      add("FZ-VAL-TIME-001", [line.slot_id]);
    independentTotal += time.total;
    if (
      candidate.content.equipment === null ||
      candidate.content.equipment.some(
        (e) =>
          !request.equipment.available.includes(e) ||
          request.equipment.unsafe.includes(e),
      )
    )
      add("FZ-VAL-EQUIPMENT-001", [line.content_version]);
    if (
      candidate.content.supervision_required &&
      request.facts["formation.supervised"] !== true
    )
      add("FZ-VAL-SUPERVISION-001", [line.content_version]);
    if (
      (request.space === "LIMITED" &&
        candidate.content.tags?.includes("large_space")) ||
      (candidate.content.environment?.length &&
        !candidate.content.environment.every(
          (e) =>
            Array.isArray(request.facts["environment.tags"]) &&
            request.facts["environment.tags"].includes(e),
        ))
    )
      add("FZ-VAL-ENVIRONMENT-001", [line.content_version]);
    const authority = input.authority.content[line.content_version];
    if (request.mode === "PRODUCTION") {
      if (
        !authority ||
        candidate.content.synthetic ||
        candidate.content.status !== "PUBLISHED" ||
        !candidate.content.production_eligible
      )
        add("FZ-VAL-CONTENT-001", [line.content_version]);
      if (
        !authority?.published ||
        !authority.production_eligible ||
        !authority.rights_eligible ||
        !authority.reviews_eligible ||
        !authority.current_for_new_use
      )
        add("FZ-VAL-RIGHTS-001", [line.content_version]);
    } else if (!candidate.content.synthetic)
      add("FZ-VAL-CONTENT-001", [line.content_version]);
    if (
      !Number.isInteger(d.intensity.level) ||
      d.intensity.level < 0 ||
      d.intensity.level > 5
    )
      continue;
    const evaluation = evaluate({
      mode: request.mode,
      as_of: request.training_date,
      rule_set_version: input.rule_set_version,
      knowledge_version: input.knowledge_version,
      facts,
      candidates: [{ ...candidate.content, intensity: d.intensity.level }],
      rules: input.rules,
    });
    const decision = evaluation.results[0]!;
    decisions.push({ line, candidate, decision, work: time.work });
    const intensityViolated =
      Boolean(decision.constraints.intensity) &&
      d.intensity.level > Number(decision.constraints.intensity!.value);
    const complexityViolated =
      Boolean(decision.constraints.complexity) &&
      Number(candidate.content.complexity) >
        Number(decision.constraints.complexity!.value);
    if (intensityViolated || complexityViolated)
      add("FZ-VAL-DOSE-002", [line.content_version]);
    if (!decision.eligible) {
      add("FZ-VAL-SAFETY-001", [line.content_version]);
    }
    const recoveryViolated =
      Boolean(decision.constraints.recovery) && candidate.kind !== "RECOVERY";
    if (
      !decision.eligible ||
      intensityViolated ||
      complexityViolated ||
      recoveryViolated
    ) {
      for (const reason of decision.reasons) {
        if (reason.category === "FUNCTIONAL_RESTRICTIONS")
          add("FZ-VAL-RESTRICTION-001", [line.content_version]);
        if (reason.category === "OFFICIAL_POLICY")
          add("FZ-VAL-POLICY-001", [line.content_version]);
        if (reason.category === "READINESS")
          add("FZ-VAL-READINESS-001", [line.content_version]);
        if (reason.category === "RECOVERY_RECENT_LOAD")
          add("FZ-VAL-LOAD-001", [line.content_version]);
        if (reason.category === "PROGRAM_PHASE")
          add("FZ-VAL-PHASE-001", [line.content_version]);
      }
    }
    if (recoveryViolated) add("FZ-VAL-READINESS-001", [line.content_version]);
    const explicit = line.selection_reasons.includes("EXPLICIT_RELATIONSHIP");
    if (explicit) {
      const valid = request.relationship_requests.some((rr) =>
        candidateByVersion
          .get(rr.from_version)
          ?.relationships.some(
            (rel) =>
              rel.type === rr.type &&
              rel.target_version === line.content_version,
          ),
      );
      if (!valid) add("FZ-VAL-RELATIONSHIP-001", [line.content_version]);
    } else if (!line.selection_reasons.includes("REVIEWED_SLOT_MATCH"))
      add("FZ-VAL-RELATIONSHIP-001", [line.content_version]);
  }
  for (const slot of template.slots) {
    const present = session.lines.some((l) => l.slot_id === slot.id);
    if (slot.required && !present) add("FZ-VAL-STRUCTURE-002", [slot.id]);
    if (!slot.required && !present) add("FZ-VAL-STRUCTURE-090", [slot.id]);
  }
  for (const line of session.lines.filter(
    (l) =>
      candidateByVersion.get(l.content_version)?.metadata.prepares_movements
        .length,
  )) {
    const prep = candidateByVersion.get(line.content_version)!;
    if (
      !session.lines.some(
        (other) =>
          other !== line &&
          candidateByVersion.get(other.content_version)?.kind !== "RECOVERY" &&
          prep.metadata.prepares_movements.includes(
            candidateByVersion.get(other.content_version)?.content.movement ??
              "",
          ),
      )
    )
      add("FZ-VAL-MOVEMENT-001", [line.content_version]);
  }
  for (const key of exposureKeys) {
    const caps = decisions.flatMap(({ decision }) =>
      decision.constraints[key]
        ? [Number(decision.constraints[key]!.value)]
        : [],
    );
    const exposed = decisions
      .filter(({ candidate }) =>
        key === "running" || key === "rucking"
          ? candidate.content.tags?.includes(key)
          : Number(candidate.content.demand[key + "_demand"] ?? 0) > 0,
      )
      .reduce((n, x) => n + x.work, 0);
    if (
      caps.length &&
      (template.limit_units[key] !== "WORK_SECONDS" ||
        exposed > Math.min(...caps))
    )
      add("FZ-VAL-DEMAND-001", [key]);
  }
  const sectionTotals = new Map<string, number>();
  for (const line of session.lines)
    sectionTotals.set(
      line.section,
      (sectionTotals.get(line.section) ?? 0) +
        independentTiming(line.dose).total,
    );
  if (
    session.sections.length !== sectionTotals.size ||
    session.sections.some(
      (s) => sectionTotals.get(s.section) !== s.total_seconds,
    ) ||
    session.total_seconds !== independentTotal ||
    session.unused_seconds !== request.duration_seconds - independentTotal
  )
    add("FZ-VAL-TIME-001");
  if (independentTotal > request.duration_seconds) add("FZ-VAL-TIME-002");
  const order = session.lines.map((l) => SECTIONS.indexOf(l.section as never));
  if (
    order.some((v) => v < 0) ||
    order.some((v, i) => i > 0 && v < order[i - 1]!)
  )
    add("FZ-VAL-STRUCTURE-001");
  const expectedRationale =
    "Candidate session assembled for the requested objective using eligible content, the required structure and the supplied time budget. Independent validation has not been performed.";
  if (rx.public_rationale !== expectedRationale) add("FZ-VAL-EXPLAIN-001");
  const sensitive = Object.values(request.facts)
    .flatMap((value) =>
      typeof value === "string" ? [value] : Array.isArray(value) ? value : [],
    )
    .filter((value) => value.length > 2);
  if (sensitive.some((token) => rx.public_rationale.includes(token)))
    add("FZ-VAL-PRIVACY-001");
  const internal = rx.internal as {
    base?: {
      results?: {
        content_version: string;
        eligible: boolean;
        blocked: boolean;
      }[];
    };
  };
  if (
    session.lines.some((line) =>
      internal?.base?.results?.some(
        (r) =>
          r.content_version === line.content_version &&
          (!r.eligible || r.blocked),
      ),
    )
  )
    add("FZ-VAL-INTERNAL-001");
  return finish(input, findings, checks);
}

function finish(
  input: ValidationInput | null,
  findings: Finding[],
  checks: readonly string[],
) {
  const sorted = [...findings].sort(
    (a, b) =>
      compare(a.code, b.code) ||
      compare(canonical(a.references), canonical(b.references)),
  );
  const blocking = sorted.filter((f) => f.blocking),
    warnings = sorted.filter((f) => !f.blocking);
  const disallowedWarning = warnings.some(
    (w) => !input?.policy.approved_nonblocking_codes.includes(w.code),
  );
  const status =
    blocking.length || disallowedWarning
      ? "REJECT"
      : warnings.length
        ? "WARN"
        : "PASS";
  const rejectionReasons = [
    ...blocking.map((f) => f.code),
    ...warnings
      .filter((w) => !input?.policy.approved_nonblocking_codes.includes(w.code))
      .map((w) => w.code),
  ].sort(compare);
  const material = {
    engine_version: ENGINE_VERSION,
    prescription_id: input?.prescription.prescription_id ?? null,
    prescription_engine_version: input?.prescription.engine_version ?? null,
    policy_version: input?.policy.version ?? null,
    status,
    codes: sorted.map((f) => f.code),
    warnings: warnings.map((f) => f.code),
    rejection_reasons: rejectionReasons,
    checks_executed: [...checks],
    provenance: {
      rule_set_version: input?.rule_set_version ?? null,
      template_version: input?.template.version_id ?? null,
      content_versions:
        input?.prescription.session?.lines
          .map((l) => l.content_version)
          .sort(compare) ?? [],
      stored_input_fingerprint: input?.stored_input_fingerprint ?? null,
      stored_artifact_fingerprint: input?.stored_artifact_fingerprint ?? null,
    },
    public_summary:
      status === "PASS"
        ? "The candidate session passed independent validation."
        : status === "WARN"
          ? "The candidate session passed with an approved nonblocking warning."
          : "The candidate session did not pass independent validation and cannot be delivered.",
    restricted_trace: sorted,
  };
  return {
    validation_id:
      "FZ-VALIDATION-" +
      createHash("sha256").update(canonical(material)).digest("hex"),
    ...material,
    validated_at: null as string | null,
  };
}
export type ValidationResult = ReturnType<typeof validate>;
