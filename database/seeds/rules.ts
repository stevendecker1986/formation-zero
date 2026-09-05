import type pg from "pg";
import { randomUUID } from "node:crypto";
import { syntheticRules } from "@formation-zero/rule-engine/fixtures";
import { template } from "@formation-zero/knowledge/templates";
import { transaction } from "../../services/api/src/db.js";
import { insert } from "../../services/api/src/knowledge/store.js";
export async function seedRules(pool: pg.Pool, environment: string) {
  if (!["LOCAL", "TEST"].includes(environment))
    throw new Error("Synthetic rules are LOCAL/TEST only");
  return transaction(pool, async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(620260904)");
    const prior = (
      await c.query(
        "SELECT v.id FROM kb_versions v JOIN kb_entities e ON e.id=v.entity_id WHERE e.kind='RULE_SET' AND v.title='SYNTHETIC Phase C golden set v1' AND v.version=1",
      )
    ).rows[0];
    if (prior) return prior.id as string;
    const actor = { userId: "fixture-base", requestId: randomUUID() };
    const author = await insert(c, actor, "AUTHOR", {
      ...template("AUTHOR"),
      name: "Synthetic rule author; not a real professional",
    });
    const rights = await insert(c, actor, "RIGHTS", template("RIGHTS"));
    const authored = {
      author: author.id,
      rights: rights.id,
      provenance: "FZ_ORIGINAL",
      citations: [],
      synthetic: true,
      effective_date: null,
    };
    const ids: string[] = [];
    for (const rule of syntheticRules) {
      const reason = {
        category: rule.reason.category,
        explanation: rule.reason.explanation,
        severity: rule.reason.severity,
      };
      const reasonVersion = await insert(c, actor, "REASON_CODE", {
        ...authored,
        name: "Synthetic reason for " + rule.rule_id,
        reason,
      });
      const {
        priority,
        type,
        condition,
        effects,
        effective_from,
        effective_until,
        population,
        unknown_behavior,
      } = rule;
      const v = await insert(c, actor, "RULE", {
        ...authored,
        name: "Synthetic scenario " + rule.rule_id,
        reason_code: reasonVersion.id,
        definition: {
          priority,
          type,
          condition,
          effects,
          effective_from,
          effective_until,
          population,
          unknown_behavior,
        },
      });
      ids.push(v.id);
    }
    return (
      await insert(c, actor, "RULE_SET", {
        ...authored,
        name: "SYNTHETIC Phase C golden set v1",
        rules: ids,
      })
    ).id;
  });
}
