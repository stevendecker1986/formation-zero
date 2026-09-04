import { loadConfig } from "@formation-zero/config";
import { createPool, transaction } from "../services/api/src/db.js";
const pool = createPool(loadConfig(process.env));
try {
  await transaction(pool, async (client) => {
    await client.query("DELETE FROM request_limits WHERE expires_at < now()");
    await client.query(
      "DELETE FROM consumed_auth_tokens WHERE expires_at < now()",
    );
    await client.query('DELETE FROM auth_sessions WHERE "expiresAt" < now()');
    await client.query(
      'DELETE FROM auth_verifications WHERE "expiresAt" < now()',
    );
    await client.query(
      'DELETE FROM auth_rate_limits WHERE "lastRequest" < $1',
      [Date.now() - 86400000],
    );
  });
  console.log("Expired authentication infrastructure records removed.");
} finally {
  await pool.end();
}
