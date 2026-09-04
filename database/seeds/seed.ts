import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import type pg from "pg";
import { TIERS } from "@formation-zero/domain";
import { resolveCapabilities } from "@formation-zero/entitlements";
import { loadConfig } from "@formation-zero/config";
import { createPool, transaction } from "../../services/api/src/db.js";
export async function seed(pool: pg.Pool, environment: string): Promise<void> {
  if (!["LOCAL", "TEST"].includes(environment))
    throw new Error("Synthetic seeds are LOCAL/TEST only");
  await transaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(4612002)");
    for (const tier of TIERS) {
      for (const capability of resolveCapabilities(tier))
        await client.query(
          "INSERT INTO subscription_entitlements(tier,capability) VALUES($1,$2) ON CONFLICT DO NOTHING",
          [tier, capability],
        );
      // Disabled, credential-free fixtures cannot be used to sign in.
      const id = `fixture-${tier.toLowerCase()}`;
      await client.query(
        'INSERT INTO users(id,name,email,"emailVerified","createdAt","updatedAt",enabled) VALUES($1,$2,$3,false,now(),now(),false) ON CONFLICT(id) DO NOTHING',
        [id, `Synthetic ${tier}`, `${tier.toLowerCase()}@example.invalid`],
      );
      await client.query(
        "UPDATE subscription_accounts SET tier=$2 WHERE user_id=$1",
        [id, tier],
      );
    }
    const prior = await client.query(
      "SELECT 1 FROM audit_events WHERE action=$1",
      ["fixtures.seeded"],
    );
    if (!prior.rowCount)
      await client.query(
        "INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,reason,metadata,request_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          randomUUID(),
          "local-bootstrap",
          "fixtures.seeded",
          "ACCOUNT",
          "synthetic-fixtures",
          "LOCAL_FIXTURE",
          "{}",
          randomUUID(),
        ],
      );
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const config = loadConfig(process.env);
  const pool = createPool(config);
  try {
    await seed(pool, config.APP_ENV);
    console.log("Synthetic disabled fixtures seeded.");
  } finally {
    await pool.end();
  }
}
