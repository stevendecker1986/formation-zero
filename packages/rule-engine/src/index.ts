import { createHash } from "node:crypto";
import {
  evaluationSchema,
  type Candidate,
  type Condition,
  type Effect,
  type EvaluationInput,
  type Rule,
} from "./schemas.js";
export * from "./schemas.js";
export const ENGINE_VERSION = "1.0.0";
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export function canonical(value: unknown): string {
  if (Array.isArray(value))
    return "[" + value.map(canonical).sort(compare).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => compare(a, b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value) ?? "null";
}
export const fingerprint = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
type Truth = true | false | "UNKNOWN";
const unknown = (v: unknown) =>
  v === undefined || v === null || v === "UNKNOWN";
function read(
  path: string,
  facts: EvaluationInput["facts"],
  candidate: Candidate,
): unknown {
  if (!path.startsWith("candidate.")) return facts[path];
  const key = path.slice(10);
  return key.startsWith("demand.")
    ? candidate.demand[key.slice(7)]
    : candidate[key as keyof Candidate];
}
export function condition(
  c: Condition,
  facts: EvaluationInput["facts"],
  candidate: Candidate,
): Truth {
  if (c.op === "AND" || c.op === "OR") {
    const values = c.args.map((x) => condition(x, facts, candidate));
    return c.op === "AND"
      ? values.includes(false)
        ? false
        : values.includes("UNKNOWN")
          ? "UNKNOWN"
          : true
      : values.includes(true)
        ? true
        : values.includes("UNKNOWN")
          ? "UNKNOWN"
          : false;
  }
  if (c.op === "NOT") {
    const v = condition(c.arg, facts, candidate);
    return v === "UNKNOWN" ? v : !v;
  }
  if (c.op === "EQUIPMENT_AVAILABLE") {
    if (candidate.equipment?.length === 0) return true;
    const available = facts["equipment.available"],
      unsafe = facts["equipment.unsafe"];
    if (
      !candidate.equipment ||
      !Array.isArray(available) ||
      !Array.isArray(unsafe)
    )
      return "UNKNOWN";
    return candidate.equipment.every(
      (x) => available.includes(x) && !unsafe.includes(x),
    );
  }
  if (!("path" in c)) return "UNKNOWN";
  const v = read(c.path, facts, candidate);
  if (c.op === "EXISTS") return !unknown(v);
  if (c.op === "MISSING") return unknown(v);
  if (unknown(v)) return "UNKNOWN";
  if (c.op === "RANGE")
    return typeof v === "number" ? v >= c.min && v <= c.max : "UNKNOWN";
  if (!("value" in c)) return "UNKNOWN";
  if (c.op === "HAS") return Array.isArray(v) ? v.includes(c.value) : "UNKNOWN";
  if (c.op === "EQ" || c.op === "NE")
    return typeof v !== typeof c.value
      ? "UNKNOWN"
      : c.op === "EQ"
        ? v === c.value
        : v !== c.value;
  if (typeof v !== "number" || typeof c.value !== "number") return "UNKNOWN";
  return c.op === "GT"
    ? v > c.value
    : c.op === "GTE"
      ? v >= c.value
      : c.op === "LT"
        ? v < c.value
        : v <= c.value;
}
export function evaluate(raw: unknown) {
  const input = evaluationSchema.parse(raw);
  const rules = [...input.rules].sort(
    (a, b) =>
      a.priority - b.priority ||
      compare(a.rule_id, b.rule_id) ||
      a.version - b.version,
  );
  const input_hash = fingerprint(input);
  const results = [...input.candidates]
    .sort((a, b) => compare(a.id, b.id))
    .map((candidate) => {
      let blocked = false,
        noAutomatic = false;
      const constraints: Record<
        string,
        { value: unknown; priority: number; rule: string }
      > = {};
      const scores = Array<number>(13).fill(0);
      const reasons: {
        code: string;
        category: string;
        explanation: string;
        severity: string;
        rule_id: string;
        version: number;
      }[] = [];
      const trace: {
        rule_id: string;
        version: number;
        priority: number;
        result: string;
        effects: { effect: Effect; result: string }[];
      }[] = [];
      function reason(rule: Rule) {
        if (
          !reasons.some(
            (r) => r.rule_id === rule.rule_id && r.version === rule.version,
          )
        )
          reasons.push({
            ...rule.reason,
            rule_id: rule.rule_id,
            version: rule.version,
          });
      }
      function system(code: string, explanation: string) {
        blocked = true;
        reasons.push({
          code,
          explanation,
          category: "EXERCISE_ELIGIBILITY",
          severity: "BLOCK",
          rule_id: "ENGINE",
          version: 1,
        });
      }
      if (
        input.mode === "PRODUCTION" &&
        (candidate.synthetic ||
          !candidate.production_eligible ||
          candidate.status !== "PUBLISHED")
      )
        system(
          "FZ-RSN-CONTENT-NOT-ELIGIBLE",
          "Content has not satisfied production eligibility gates.",
        );
      if (input.mode === "TEST" && !candidate.synthetic)
        system(
          "FZ-RSN-TEST-ISOLATION",
          "Test evaluation requires explicitly synthetic candidates.",
        );
      if (!rules.length)
        system(
          "FZ-RSN-RULE-SET-UNAVAILABLE",
          "No applicable validated rule set is available.",
        );
      for (const rule of rules) {
        const entry = {
          rule_id: rule.rule_id,
          version: rule.version,
          priority: rule.priority,
          result: "NOT_MATCHED",
          effects: [] as { effect: Effect; result: string }[],
        };
        trace.push(entry);
        if (
          input.mode === "PRODUCTION"
            ? rule.synthetic ||
              rule.status !== "PUBLISHED" ||
              !rule.production_eligible
            : !rule.synthetic
        ) {
          entry.result = "MODE_INELIGIBLE";
          system(
            "FZ-RSN-RULE-NOT-ELIGIBLE",
            "A referenced rule is not eligible in this evaluation mode.",
          );
          continue;
        }
        if (
          input.as_of < rule.effective_from ||
          (rule.effective_until && input.as_of >= rule.effective_until)
        ) {
          entry.result = "OUTSIDE_EFFECTIVE_INTERVAL";
          continue;
        }
        let match: Truth = condition(rule.condition, input.facts, candidate);
        if (rule.population) {
          const population = input.facts["policy.population"];
          match = unknown(population)
            ? "UNKNOWN"
            : population !== rule.population
              ? false
              : match;
        }
        if (match === false) continue;
        if (match === "UNKNOWN") {
          entry.result = "UNKNOWN";
          reason(rule);
          if (rule.priority <= 3 || rule.unknown_behavior === "BLOCK")
            blocked = true;
          noAutomatic = true;
          reasons.push({
            code: "FZ-RSN-REQUIRED-FACT-UNKNOWN",
            category: "SAFETY",
            explanation:
              "Required information is unavailable; automatic use is withheld.",
            severity: "BLOCK",
            rule_id: rule.rule_id,
            version: rule.version,
          });
          continue;
        }
        entry.result = "MATCHED";
        for (const effect of [...rule.effects].sort((a, b) =>
          compare(canonical(a), canonical(b)),
        )) {
          let outcome = "APPLIED";
          if (effect.type === "SCORE_UP" || effect.type === "SCORE_DOWN") {
            if (blocked || noAutomatic) outcome = "SUPPRESSED_BLOCKED";
            else
              scores[rule.priority] =
                (scores[rule.priority] ?? 0) +
                (effect.type === "SCORE_UP" ? 1 : -1) * effect.value;
          } else if (effect.type === "BLOCK_CANDIDATE") blocked = true;
          else if (
            effect.type === "FLAG_REVIEW" ||
            effect.type === "NO_AUTOMATIC_PRESCRIPTION"
          )
            noAutomatic = true;
          else if (effect.type === "REQUIRE_RECOVERY")
            constraints.recovery ??= {
              value: true,
              priority: rule.priority,
              rule: rule.rule_id,
            };
          else if (
            effect.type === "REQUIRE_TAG" ||
            effect.type === "EXCLUDE_TAG"
          ) {
            if (
              !candidate.tags ||
              (effect.type === "REQUIRE_TAG"
                ? !candidate.tags.includes(effect.tag)
                : candidate.tags.includes(effect.tag))
            )
              blocked = true;
            constraints[effect.type + ":" + effect.tag] ??= {
              value: true,
              priority: rule.priority,
              rule: rule.rule_id,
            };
          } else if (effect.type === "REQUIRE_ATTRIBUTE") {
            const key = "attribute:" + effect.path,
              prior = constraints[key];
            if (prior && prior.value !== effect.value) {
              outcome =
                prior.priority < rule.priority
                  ? "SUPPRESSED_HIGHER_PRIORITY"
                  : "CONFLICT_NO_SAFE_OPTION";
              if (prior.priority === rule.priority) blocked = true;
            } else {
              constraints[key] ??= {
                value: effect.value,
                priority: rule.priority,
                rule: rule.rule_id,
              };
              if (read(effect.path, input.facts, candidate) !== effect.value)
                blocked = true;
            }
          } else if (
            effect.type === "MODIFY_LIMIT" ||
            effect.type === "CAP_COMPLEXITY" ||
            effect.type === "CAP_INTENSITY"
          ) {
            const key =
              effect.type === "MODIFY_LIMIT"
                ? effect.key
                : effect.type === "CAP_COMPLEXITY"
                  ? "complexity"
                  : "intensity";
            const prior = constraints[key];
            if (prior && prior.priority < rule.priority)
              outcome = "SUPPRESSED_HIGHER_PRIORITY";
            else {
              const value = prior
                ? Math.min(Number(prior.value), effect.value)
                : effect.value;
              if (prior && prior.value !== effect.value)
                outcome = "SAME_PRIORITY_RESTRICTIVE_MINIMUM";
              constraints[key] = {
                value,
                priority: rule.priority,
                rule:
                  prior && Number(prior.value) <= effect.value
                    ? prior.rule
                    : rule.rule_id,
              };
            }
          }
          entry.effects.push({ effect, result: outcome });
          reason(rule);
        }
      }
      for (const key of ["complexity", "intensity"] as const)
        if (
          constraints[key] &&
          (candidate[key] === null ||
            candidate[key]! > Number(constraints[key]!.value))
        )
          system(
            "FZ-RSN-CANDIDATE-EXCEEDS-CAP",
            "Candidate metadata does not satisfy an applicable limit.",
          );
      return {
        candidate_id: candidate.id,
        content_version: candidate.content_version,
        eligible: !blocked && !noAutomatic,
        blocked,
        no_automatic_prescription: noAutomatic,
        constraints,
        scores,
        reasons,
        trace,
      };
    });
  const eligible = results
    .filter((x) => x.eligible)
    .sort((a, b) => {
      for (let p = 0; p < 13; p++) {
        const diff = (b.scores[p] ?? 0) - (a.scores[p] ?? 0);
        if (diff) return diff;
      }
      return compare(a.candidate_id, b.candidate_id);
    });
  return {
    evaluation_id:
      "FZ-EVAL-" + fingerprint({ engine: ENGINE_VERSION, input_hash }),
    engine_version: ENGINE_VERSION,
    rule_set_version: input.rule_set_version,
    knowledge_version: input.knowledge_version,
    input_hash,
    as_of: input.as_of,
    rule_versions: rules.map((r) => ({
      rule_id: r.rule_id,
      version: r.version,
      version_id: r.version_id,
      provenance: r.provenance,
      citations: [...r.citations].sort(compare),
      reason_code: r.reason.code,
      reason_version_id: r.reason_version_id,
      effective_from: r.effective_from,
      effective_until: r.effective_until,
    })),
    outcome: eligible.length
      ? "CONSTRAINTS_EVALUATED"
      : "NO_SAFE_ELIGIBLE_OPTION",
    ranked_eligible: eligible.map((x) => x.candidate_id),
    warnings: [
      ...new Set(
        results.flatMap((x) =>
          x.reasons
            .filter(
              (r) =>
                r.severity === "WARNING" ||
                r.code === "FZ-RSN-REQUIRED-FACT-UNKNOWN",
            )
            .map((r) => r.code),
        ),
      ),
    ].sort(compare),
    results,
  };
}
export type Evaluation = ReturnType<typeof evaluate>;
