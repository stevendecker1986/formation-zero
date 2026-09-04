import type pg from "pg";
import { randomUUID } from "node:crypto";
import { transaction } from "../../services/api/src/db.js";
import { insert } from "../../services/api/src/knowledge/store.js";
import { template } from "@formation-zero/knowledge/templates";
import type { Kind } from "@formation-zero/knowledge";
export async function seedKnowledge(pool: pg.Pool, environment: string) {
  if (!["LOCAL", "TEST"].includes(environment))
    throw new Error("Synthetic knowledge seed denied");
  await transaction(pool, async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(4612003)");
    if (
      (
        await c.query(
          "SELECT 1 FROM kb_versions WHERE title='Synthetic source registry fixture'",
        )
      ).rowCount
    )
      return;
    const actor = { userId: "fixture-base", requestId: randomUUID() };
    const add = (kind: Kind, data: Record<string, unknown>) =>
      insert(c, actor, kind, { ...template(kind), ...data });
    const author = await add("AUTHOR", {
      name: "Synthetic author",
      platform_user_id: "fixture-base",
    });
    const reviewer = await add("REVIEWER", {
      name: "Synthetic reviewer — disabled fixture",
      person: author.id,
      user_id: "fixture-performance",
      review_types: ["EDITORIAL"],
    });
    const rights = await add("RIGHTS", { name: "Synthetic unknown rights" });
    const source = await add("SOURCE", {
      name: "Synthetic source registry fixture",
    });
    const version = await add("SOURCE_VERSION", { source: source.id });
    const section = await add("SOURCE_SECTION", { source_version: version.id });
    const citation = await add("CITATION", { section: section.id });
    const equipment = await add("EQUIPMENT", {
      name: "Synthetic no-equipment catalog fixture",
    });
    await add("EQUIPMENT", {
      name: "Synthetic shared equipment fixture",
      quantity_semantics: "SHARED",
      mobility: "PORTABLE",
    });
    const media = await add("MEDIA_REQUIREMENT", {});
    await add("EXERCISE", {
      author: author.id,
      rights: rights.id,
      citations: [citation.id],
      equipment: [equipment.id],
      media_requirement: media.id,
    });
    await add("RECOVERY", {
      author: author.id,
      rights: rights.id,
      citations: [citation.id],
    });
    // Explicit synthetic historical review: no grants, enabled users, or publication.
    await c.query(
      "INSERT INTO kb_reviews(id,version_id,reviewer_id,reviewer_user_id,review_type,decision,comments) VALUES($1,$2,$3,'fixture-performance','EDITORIAL','CHANGES_REQUIRED','SYNTHETIC review flow: source has no real evidence and must not publish.')",
      [randomUUID(), version.id, reviewer.id],
    );
    await c.query(
      "INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,reason,metadata,request_id) VALUES($1,'local-bootstrap','knowledge.fixtures.seeded','KNOWLEDGE',$2,'LOCAL_FIXTURE','{}',$3)",
      [randomUUID(), source.id, actor.requestId],
    );
  });
}
