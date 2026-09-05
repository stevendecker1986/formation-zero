import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import { createHmac, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import type pg from "pg";
import { z } from "zod";
import type { ServerConfig } from "@formation-zero/config";
import {
  registerSchema,
  loginSchema,
  emailSchema,
  tokenSchema,
  resetSchema,
  profileSchema,
} from "@formation-zero/schemas";
import { resolveCapabilities } from "@formation-zero/entitlements";
import { hasRole, type AuthorizationContext } from "@formation-zero/domain";
import { createAuth } from "./auth.js";
import { resolveAuthorization } from "./authorization.js";
import { createLogger, type LogSink } from "./logging.js";
import { createMailDelivery, type MailDelivery } from "./mail.js";
import { knowledgeRouter } from "./knowledge/routes.js";

export function createApp(
  config: ServerConfig,
  pool: pg.Pool,
  options: { deliver?: MailDelivery; logSink?: LogSink } = {},
) {
  const app = express();
  const auth = createAuth(
    config,
    pool,
    options.deliver ?? createMailDelivery(config),
  );
  const log = createLogger(options.logSink);
  const origins = new Set([
    config.API_ORIGIN,
    config.WEB_ORIGIN,
    config.ADMIN_ORIGIN,
  ]);
  app.disable("x-powered-by");
  app.set("trust proxy", false);
  app.use(helmet());
  app.use((req, res, next) => {
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);
    res.setHeader("Cache-Control", "no-store");
    res.on("finish", () =>
      log({
        level: "info",
        event: "request.completed",
        requestId,
        userId: res.locals.userId as string | undefined,
        status: res.statusCode,
      }),
    );
    const origin = req.get("origin");
    if (origin && !origins.has(origin)) {
      fail(res, 403, "ORIGIN_DENIED");
      return;
    }
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.vary("Origin");
    }
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.sendStatus(204);
      return;
    }
    if (
      !["GET", "HEAD"].includes(req.method) &&
      (!origin || !req.is("application/json"))
    ) {
      fail(res, 403, "ORIGIN_OR_CONTENT_TYPE_REQUIRED");
      return;
    }
    next();
  });
  app.use(express.json({ limit: "16kb" }));
  app.get("/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "formation-zero-api" });
  });
  app.get("/api/v1", (_req, res) =>
    res.json({
      name: "Formation Zero",
      phase: "A",
      commercialGateApproved: false,
    }),
  );

  const authHeaders = (req: Request): Headers => {
    const headers = new Headers({
      origin: req.get("origin") ?? config.API_ORIGIN,
    });
    const cookie = req.get("cookie");
    if (cookie) headers.set("cookie", cookie);
    return headers;
  };
  const rateLimit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // HMAC keys retain no IP or email; shared PostgreSQL counter survives API restarts.
      const keys = [`ip:${req.ip ?? "unknown"}`];
      if (typeof req.body?.email === "string")
        keys.push(`email:${req.body.email.toLowerCase()}`);
      for (const key of keys) {
        const hash = createHmac("sha256", config.AUTH_SECRET)
          .update(key)
          .digest("hex");
        const count = await pool.query<{ count: number }>(
          `INSERT INTO request_limits(key, count, expires_at) VALUES ($1,1,now() + interval '60 seconds') ON CONFLICT (key) DO UPDATE SET count = CASE WHEN request_limits.expires_at < now() THEN 1 ELSE request_limits.count + 1 END, expires_at = CASE WHEN request_limits.expires_at < now() THEN now() + interval '60 seconds' ELSE request_limits.expires_at END RETURNING count`,
          [hash],
        );
        if ((count.rows[0]?.count ?? 100) > 20) {
          res.setHeader("Retry-After", "60");
          fail(res, 429, "RATE_LIMITED");
          return;
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
  app.use("/api/v1/auth", rateLimit);
  const generic = {
    message:
      "If this request is eligible, account instructions will be delivered.",
  };
  const respondAuth = async (
    res: Response,
    response: globalThis.Response,
    mode: "generic" | "login" | "action",
  ) => {
    for (const cookie of response.headers.getSetCookie())
      res.append("Set-Cookie", cookie);
    if (mode === "generic" && response.status < 500) {
      res.status(202).json(generic);
      return;
    }
    if (!response.ok) {
      fail(
        res,
        response.status >= 500 ? 503 : mode === "login" ? 401 : 400,
        response.status >= 500
          ? "SERVICE_UNAVAILABLE"
          : mode === "login"
            ? "INVALID_CREDENTIALS"
            : "INVALID_OR_EXPIRED_REQUEST",
      );
      return;
    }
    res.json({ ok: true });
  };
  async function enumerationSafe(
    work: () => Promise<globalThis.Response>,
  ): Promise<globalThis.Response> {
    const started = Date.now();
    try {
      return await work();
    } finally {
      await delay(Math.max(0, 600 - (Date.now() - started)));
    }
  }
  app.post("/api/v1/auth/register", async (req, res) => {
    const body = registerSchema.parse(req.body);
    await respondAuth(
      res,
      await enumerationSafe(() =>
        auth.api.signUpEmail({
          body,
          headers: authHeaders(req),
          asResponse: true,
        }),
      ),
      "generic",
    );
  });
  app.post("/api/v1/auth/login", async (req, res) => {
    const body = loginSchema.parse(req.body);
    await respondAuth(
      res,
      await enumerationSafe(() =>
        auth.api.signInEmail({
          body,
          headers: authHeaders(req),
          asResponse: true,
        }),
      ),
      "login",
    );
  });
  app.post("/api/v1/auth/logout", async (req, res) => {
    z.object({}).strict().parse(req.body);
    await respondAuth(
      res,
      await auth.api.signOut({ headers: authHeaders(req), asResponse: true }),
      "action",
    );
  });
  app.post("/api/v1/auth/request-password-reset", async (req, res) => {
    const body = emailSchema.parse(req.body);
    await respondAuth(
      res,
      await enumerationSafe(() =>
        auth.api.requestPasswordReset({
          body,
          headers: authHeaders(req),
          asResponse: true,
        }),
      ),
      "generic",
    );
  });
  app.post("/api/v1/auth/send-verification-email", async (req, res) => {
    const body = emailSchema.parse(req.body);
    // Do not forward cookies: public response is identical even for signed-in users.
    await respondAuth(
      res,
      await enumerationSafe(() =>
        auth.api.sendVerificationEmail({ body, asResponse: true }),
      ),
      "generic",
    );
  });
  async function consumeToken(token: string, kind: string): Promise<boolean> {
    const hash = createHmac("sha256", config.AUTH_SECRET)
      .update(`${kind}:${token}`)
      .digest("hex");
    const inserted = await pool.query(
      "INSERT INTO consumed_auth_tokens(hash, expires_at) VALUES ($1,now() + interval '1 day') ON CONFLICT DO NOTHING",
      [hash],
    );
    return inserted.rowCount === 1;
  }
  app.post("/api/v1/auth/verify-email", async (req, res) => {
    const body = tokenSchema.parse(req.body);
    if (!(await consumeToken(body.token, "verify"))) {
      fail(res, 400, "INVALID_OR_EXPIRED_REQUEST");
      return;
    }
    await respondAuth(
      res,
      await auth.api.verifyEmail({ query: body, asResponse: true }),
      "action",
    );
  });
  app.post("/api/v1/auth/reset-password", async (req, res) => {
    const body = resetSchema.parse(req.body);
    if (!(await consumeToken(body.token, "reset"))) {
      fail(res, 400, "INVALID_OR_EXPIRED_REQUEST");
      return;
    }
    await respondAuth(
      res,
      await auth.api.resetPassword({ body, asResponse: true }),
      "action",
    );
  });
  const authenticated = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const session = await auth.api.getSession({ headers: authHeaders(req) });
      const context = session
        ? await resolveAuthorization(pool, session.user.id)
        : null;
      if (!context) {
        fail(res, 401, "UNAUTHENTICATED");
        return;
      }
      res.locals.context = context;
      res.locals.userId = context.identity.userId;
      next();
    } catch (error) {
      next(error);
    }
  };
  app.get("/api/v1/account", authenticated, async (_req, res) => {
    const context = res.locals.context as AuthorizationContext;
    const profile = await pool.query<{ display_name: string }>(
      "SELECT display_name FROM user_profiles WHERE user_id = $1",
      [context.identity.userId],
    );
    res.json({
      userId: context.identity.userId,
      displayName: profile.rows[0]?.display_name,
      roles: context.roles,
      tier: context.tier,
      capabilities: resolveCapabilities(context.tier),
    });
  });
  app.patch("/api/v1/account/profile", authenticated, async (req, res) => {
    const body = profileSchema.parse(req.body);
    await pool.query(
      "UPDATE user_profiles SET display_name = $2 WHERE user_id = $1",
      [res.locals.userId, body.displayName],
    );
    res.json({ ok: true });
  });
  app.get("/api/v1/admin", authenticated, (_req, res) => {
    if (
      !hasRole(res.locals.context as AuthorizationContext, "PLATFORM_ADMIN")
    ) {
      fail(res, 403, "FORBIDDEN");
      return;
    }
    res.json({ shell: "Formation Zero administration", phase: "A" });
  });
  app.use(
    "/api/v1/knowledge",
    authenticated,
    knowledgeRouter(pool, config.AUTH_SECRET),
  );
  app.use((_req, res) => fail(res, 404, "NOT_FOUND"));
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const invalid =
        error instanceof z.ZodError ||
        (error instanceof SyntaxError && "body" in error);
      const tooLarge =
        typeof error === "object" &&
        error !== null &&
        "type" in error &&
        error.type === "entity.too.large";
      log({
        level: "error",
        event: "request.failed",
        requestId: res.locals.requestId as string,
        status: invalid ? 400 : tooLarge ? 413 : 503,
      });
      fail(
        res,
        invalid ? 400 : tooLarge ? 413 : 503,
        invalid
          ? "INVALID_PAYLOAD"
          : tooLarge
            ? "PAYLOAD_TOO_LARGE"
            : "SERVICE_UNAVAILABLE",
      );
    },
  );
  return { app, auth };
}
function fail(res: Response, status: number, code: string): void {
  res
    .status(status)
    .json({ error: { code, requestId: res.locals.requestId as string } });
}
