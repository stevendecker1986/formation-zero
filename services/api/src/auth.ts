import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import type pg from "pg";
import type { ServerConfig } from "@formation-zero/config";
import type { MailDelivery } from "./mail.js";
import { createLogger } from "./logging.js";

export function createAuth(
  config: ServerConfig,
  pool: pg.Pool,
  deliver: MailDelivery,
) {
  const log = createLogger();
  const deliverPrivately: MailDelivery = async (mail) => {
    try {
      await deliver(mail);
    } catch {
      log({ level: "error", event: "mail.failed" });
    }
  };
  return betterAuth({
    appName: "Formation Zero",
    baseURL: config.API_ORIGIN,
    basePath: "/internal-auth",
    secret: config.AUTH_SECRET,
    database: pool,
    trustedOrigins: [config.API_ORIGIN, config.WEB_ORIGIN, config.ADMIN_ORIGIN],
    telemetry: { enabled: false },
    logger: {
      level: "error",
      log: () => log({ level: "error", event: "auth.library" }),
    },
    user: {
      modelName: "users",
      additionalFields: {
        enabled: {
          type: "boolean",
          defaultValue: true,
          input: false,
          returned: false,
        },
      },
    },
    account: { modelName: "auth_identities", identityStrategy: "provider-id" },
    session: {
      modelName: "auth_sessions",
      expiresIn: 60 * 60 * 24,
      updateAge: 60 * 60,
      cookieCache: { enabled: false },
    },
    verification: {
      modelName: "auth_verifications",
      storeIdentifier: "hashed",
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 1800,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, token }) =>
        deliverPrivately({ to: user.email, kind: "reset", token }),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      expiresIn: 1800,
      sendVerificationEmail: async ({ user, token }) =>
        deliverPrivately({ to: user.email, kind: "verify", token }),
    },
    advanced: {
      useSecureCookies:
        config.APP_ENV === "STAGING" || config.APP_ENV === "PRODUCTION",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
      ipAddress: { disableIpTracking: true },
      database: { generateId: () => crypto.randomUUID() },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const row = await pool.query<{ enabled: boolean }>(
              "SELECT enabled FROM users WHERE id = $1",
              [session.userId],
            );
            if (!row.rows[0]?.enabled)
              throw new APIError("UNAUTHORIZED", {
                message: "Invalid credentials",
              });
            return { data: { ...session, ipAddress: null, userAgent: null } };
          },
        },
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "auth_rate_limits",
      window: 60,
      max: 10,
    },
  });
}
export type Auth = ReturnType<typeof createAuth>;
