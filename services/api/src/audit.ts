import type pg from "pg";
import { randomUUID } from "node:crypto";
import type { Role, Tier } from "@formation-zero/domain";
import { transaction } from "./db.js";
import { roleSchema, tierSchema } from "@formation-zero/schemas";
export interface AuditContext {
  actorId: string;
  requestId: string;
  reason: "LOCAL_FIXTURE" | "OPERATOR_AUTHORIZED_CHANGE";
}
// Internal foundation, deliberately not exposed as a public mutation endpoint.
export async function privilegedChange(
  pool: pg.Pool,
  context: AuditContext,
  targetId: string,
  change: { role: Role } | { tier: Tier } | { enabled: boolean },
): Promise<void> {
  if (!["LOCAL_FIXTURE", "OPERATOR_AUTHORIZED_CHANGE"].includes(context.reason))
    throw new Error("INVALID_AUDIT_REASON");
  await transaction(pool, async (client) => {
    const actor = await client.query(
      "SELECT u.id FROM users u JOIN user_roles r ON r.user_id = u.id WHERE u.id = $1 AND u.enabled AND r.role = $2 FOR UPDATE OF u",
      [context.actorId, "PLATFORM_ADMIN"],
    );
    if (!actor.rowCount) throw new Error("FORBIDDEN");
    const target = await client.query(
      "SELECT id FROM users WHERE id = $1 FOR UPDATE",
      [targetId],
    );
    if (!target.rowCount) throw new Error("NOT_FOUND");
    let action: string;
    let metadata: Record<string, string | boolean>;
    if ("role" in change) {
      const role = roleSchema.parse(change.role);
      await client.query(
        "INSERT INTO user_roles(user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [targetId, role],
      );
      action = "role.granted";
      metadata = { role };
    } else if ("tier" in change) {
      const tier = tierSchema.parse(change.tier);
      await client.query(
        "UPDATE subscription_accounts SET tier = $2, updated_at = now() WHERE user_id = $1",
        [targetId, tier],
      );
      action = "entitlement.changed";
      metadata = { tier };
    } else {
      if (typeof change.enabled !== "boolean")
        throw new Error("INVALID_CHANGE");
      await client.query("UPDATE users SET enabled = $2 WHERE id = $1", [
        targetId,
        change.enabled,
      ]);
      if (!change.enabled)
        await client.query('DELETE FROM auth_sessions WHERE "userId" = $1', [
          targetId,
        ]);
      action = change.enabled ? "account.enabled" : "account.disabled";
      metadata = { enabled: change.enabled };
    }
    await client.query(
      "INSERT INTO audit_events(id, actor_id, action, entity_type, entity_id, reason, metadata, request_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        randomUUID(),
        context.actorId,
        action,
        "ACCOUNT",
        targetId,
        context.reason,
        JSON.stringify(metadata),
        context.requestId,
      ],
    );
  });
}
