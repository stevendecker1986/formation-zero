import type pg from "pg";
import { createHash, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { loadConfig } from "@formation-zero/config";
import { createPool, transaction } from "../../services/api/src/db.js";
import { insert, get } from "../../services/api/src/knowledge/store.js";
import { records, resolveRefs, auditInputs } from "./records.js";
export async function importCorpus(pool: pg.Pool) {
  const input = records(),
    integrity = auditInputs(input);
  const result = await transaction(pool, async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(620260904)");
    const actor = { userId: "b2-controlled-import", requestId: randomUUID() };
    await c.query(
      'INSERT INTO users(id,name,email,"emailVerified","createdAt","updatedAt",enabled) VALUES($1,$2,$3,false,now(),now(),false) ON CONFLICT(id) DO NOTHING',
      [
        actor.userId,
        "B2 controlled import — disabled machine principal",
        "b2-import@example.invalid",
      ],
    );
    const principal = (
      await c.query("SELECT enabled FROM users WHERE id=$1", [actor.userId])
    ).rows[0];
    if (
      principal.enabled ||
      (
        await c.query('SELECT 1 FROM auth_identities WHERE "userId"=$1', [
          actor.userId,
        ])
      ).rowCount
    )
      throw new Error(
        "Import principal must remain disabled and credential-free",
      );
    const ids = new Map<string, string>();
    let created = 0;
    for (const r of input) {
      const hash = createHash("sha256").update(JSON.stringify(r)).digest("hex");
      const prior = (
        await c.query(
          "SELECT initial_version_id,input_sha256 FROM kb_corpus_members WHERE corpus='PHASE_B2_INITIAL' AND member_key=$1",
          [r.key],
        )
      ).rows[0];
      if (prior) {
        if (prior.input_sha256 !== hash)
          throw new Error(
            `Import drift for ${r.key}; create an editorial version instead`,
          );
        await get(c, prior.initial_version_id);
        ids.set(r.key, prior.initial_version_id);
        continue;
      }
      const version = await insert(c, actor, r.kind, resolveRefs(r.data, ids));
      await c.query(
        "INSERT INTO kb_corpus_members(corpus,member_key,entity_id,initial_version_id,input_sha256,batch) VALUES('PHASE_B2_INITIAL',$1,$2,$3,$4,$5)",
        [r.key, version.entity_id, version.id, hash, r.batch],
      );
      ids.set(r.key, version.id);
      created++;
    }
    return { created, existing: input.length - created };
  });
  return { ...integrity, ...result };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const pool = createPool(loadConfig(process.env));
  try {
    console.log(await importCorpus(pool));
  } finally {
    await pool.end();
  }
}
