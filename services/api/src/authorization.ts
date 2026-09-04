import type pg from "pg";
import type { AuthorizationContext } from "@formation-zero/domain";
import { roleSchema, tierSchema } from "@formation-zero/schemas";
export async function resolveAuthorization(
  pool: pg.Pool,
  userId: string,
): Promise<AuthorizationContext | null> {
  const account = await pool.query<{ tier: string }>(
    "SELECT s.tier FROM users u JOIN subscription_accounts s ON s.user_id = u.id WHERE u.id = $1 AND u.enabled = true",
    [userId],
  );
  if (!account.rows[0]) return null;
  const roles = await pool.query<{ role: string }>(
    "SELECT role FROM user_roles WHERE user_id = $1",
    [userId],
  );
  return {
    identity: { userId },
    roles: roles.rows.map((row) => roleSchema.parse(row.role)),
    tier: tierSchema.parse(account.rows[0].tier),
  };
}
