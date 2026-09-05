import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import type pg from "pg";
import { z } from "zod";
import {
  createSchema,
  versionSchema,
  PERMISSIONS,
  MOVEMENTS,
  CAPABILITIES,
  KINDS,
} from "@formation-zero/knowledge";
import { transaction } from "../db.js";
import * as kb from "./store.js";
import { inspectCorpus } from "./corpus.js";
const actor = (res: Response) => ({
  userId: String(res.locals.userId),
  requestId: String(res.locals.requestId),
});
const id = (req: Request) => z.uuid().parse(req.params.id);
export function knowledgeRouter(pool: pg.Pool) {
  const router = Router();
  router.get("/corpus", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await inspectCorpus(pool, actor(res)));
  });
  router.get("/access", async (_req, res) => {
    res.json(await transaction(pool, (c) => kb.access(c, actor(res))));
  });
  router.get("/taxonomies", async (_req, res) => {
    await transaction(pool, (c) => kb.access(c, actor(res)));
    res.json({
      movements: MOVEMENTS,
      capabilities: CAPABILITIES,
      kinds: KINDS,
    });
  });
  router.get("/records", async (req, res) =>
    res.json(await kb.list(pool, actor(res), req.query)),
  );
  router.post("/records", async (req, res) => {
    const b = createSchema.parse(req.body);
    res.status(201).json(await kb.create(pool, actor(res), b.kind, b.data));
  });
  router.get("/versions/:id", async (req, res) =>
    res.json(await kb.read(pool, actor(res), id(req))),
  );
  router.post("/versions/:id/versions", async (req, res) => {
    const b = versionSchema.parse(req.body);
    res
      .status(201)
      .json(
        await kb.newVersion(
          pool,
          actor(res),
          id(req),
          b.expected_version,
          b.data,
        ),
      );
  });
  router.post("/versions/:id/reviews", async (req, res) =>
    res.json(await kb.review(pool, actor(res), id(req), req.body)),
  );
  router.get("/versions/:id/eligibility", async (req, res) =>
    res.json(await kb.check(pool, actor(res), id(req))),
  );
  router.post("/versions/:id/transitions", async (req, res) =>
    res.json(await kb.transition(pool, actor(res), id(req), req.body)),
  );
  router.get("/versions/:id/provenance", async (req, res) =>
    res.json(
      await transaction(pool, async (c) => {
        await kb.access(c, actor(res));
        const v = await kb.get(c, id(req));
        const refs = await c.query(
          "WITH RECURSIVE refs(id) AS (SELECT target_id FROM kb_links WHERE version_id=$1 UNION SELECT l.target_id FROM kb_links l JOIN refs r ON l.version_id=r.id) SELECT v.id,e.code,e.kind,v.title,v.payload-'credential_identifier' AS payload FROM refs r JOIN kb_versions v ON v.id=r.id JOIN kb_entities e ON e.id=v.entity_id WHERE e.kind IN ('SOURCE','SOURCE_VERSION','SOURCE_SECTION','CITATION')",
          [v.id],
        );
        return { provenance: v.payload.provenance ?? null, sources: refs.rows };
      }),
    ),
  );
  router.get("/versions/:id/rights", async (req, res) =>
    res.json(
      await transaction(pool, async (c) => {
        await kb.access(c, actor(res));
        const v = await kb.get(c, id(req));
        return v.kind === "RIGHTS"
          ? v
          : v.payload.rights
            ? await kb.get(c, String(v.payload.rights))
            : null;
      }),
    ),
  );
  router.get("/grants", async (_req, res) =>
    res.json(
      await transaction(pool, async (c) => {
        if (!(await kb.access(c, actor(res))).admin)
          throw new kb.KnowledgeError(403, "FORBIDDEN");
        return (
          await c.query(
            "SELECT user_id,permission,granted_by,created_at FROM kb_grants ORDER BY user_id,permission",
          )
        ).rows;
      }),
    ),
  );
  router.post("/grants", async (req, res) => {
    const b = z
      .object({
        user_id: z.string().min(1).max(100),
        permission: z.enum(PERMISSIONS),
        enabled: z.boolean(),
      })
      .strict()
      .parse(req.body);
    res.json(
      await kb.grant(pool, actor(res), b.user_id, b.permission, b.enabled),
    );
  });
  router.use(
    (error: unknown, _req: Request, res: Response, next: NextFunction) => {
      if (error instanceof kb.KnowledgeError) {
        res.status(error.status).json({
          error: { code: error.code, requestId: res.locals.requestId },
        });
        return;
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        ["23505", "23503", "23514", "22P02", "P0001"].includes(
          String(error.code),
        )
      ) {
        res.status(409).json({
          error: {
            code: "KNOWLEDGE_CONSTRAINT",
            requestId: res.locals.requestId,
          },
        });
        return;
      }
      next(error);
    },
  );
  return router;
}
