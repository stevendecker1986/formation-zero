import { z } from "zod";
import { environmentSchema } from "@formation-zero/schemas";
const schema = z
  .object({
    APP_ENV: environmentSchema,
    DATABASE_URL: z.url().refine((value) => {
      try {
        return ["postgres:", "postgresql:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }),
    AUTH_SECRET: z
      .string()
      .min(32)
      .refine((value) => !/^(change|example|replace)/i.test(value)),
    API_ORIGIN: z.url(),
    WEB_ORIGIN: z.url(),
    ADMIN_ORIGIN: z.url(),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LEGAL_COMMERCIAL_GATE_APPROVED: z.literal("false").default("false"),
    MAIL_MODE: z.enum(["LOCAL", "SMTP"]),
    SMTP_URL: z.url().optional(),
    MAIL_FROM: z.email().optional(),
  })
  .superRefine((value, context) => {
    if (value.APP_ENV === "STAGING" || value.APP_ENV === "PRODUCTION") {
      for (const key of ["API_ORIGIN", "WEB_ORIGIN", "ADMIN_ORIGIN"] as const) {
        if (
          !URL.canParse(value[key]) ||
          new URL(value[key]).protocol !== "https:"
        )
          context.addIssue({
            code: "custom",
            path: [key],
            message: "HTTPS required",
          });
      }
      if (
        !URL.canParse(value.DATABASE_URL) ||
        !["verify-full", "verify-ca"].includes(
          new URL(value.DATABASE_URL).searchParams.get("sslmode") ?? "",
        )
      )
        context.addIssue({
          code: "custom",
          path: ["DATABASE_URL"],
          message: "Verified database TLS required",
        });
      if (value.MAIL_MODE !== "SMTP")
        context.addIssue({
          code: "custom",
          path: ["MAIL_MODE"],
          message: "SMTP required",
        });
    }
    if (
      value.MAIL_MODE === "SMTP" &&
      (!value.SMTP_URL ||
        !URL.canParse(value.SMTP_URL) ||
        !value.MAIL_FROM ||
        new URL(value.SMTP_URL).protocol !== "smtps:" ||
        !new URL(value.SMTP_URL).username ||
        !new URL(value.SMTP_URL).password)
    )
      context.addIssue({
        code: "custom",
        path: ["SMTP_URL"],
        message: "Authenticated TLS mail configuration required",
      });
    for (const key of ["API_ORIGIN", "WEB_ORIGIN", "ADMIN_ORIGIN"] as const) {
      if (!URL.canParse(value[key])) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: "Exact HTTP(S) origin required",
        });
        continue;
      }
      const url = new URL(value[key]);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.origin !== value[key] ||
        url.username ||
        url.password
      )
        context.addIssue({
          code: "custom",
          path: [key],
          message: "Exact HTTP(S) origin required",
        });
    }
  });
export type ServerConfig = z.infer<typeof schema>;
export function loadConfig(
  env: Record<string, string | undefined>,
): ServerConfig {
  const result = schema.safeParse(env);
  if (!result.success)
    throw new Error(
      `Invalid server configuration: ${[...new Set(result.error.issues.map((issue) => issue.path.join(".")))].join(", ")}`,
    );
  return result.data;
}
