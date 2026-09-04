import { z } from "zod";
import {
  ROLES,
  TIERS,
  ENVIRONMENTS,
  CONTENT_STATUSES,
  PROVENANCE,
  RIGHTS,
  CAPABILITIES,
} from "@formation-zero/domain";
export const roleSchema = z.enum(ROLES);
export const tierSchema = z.enum(TIERS);
export const environmentSchema = z.enum(ENVIRONMENTS);
export const contentStatusSchema = z.enum(CONTENT_STATUSES);
export const provenanceSchema = z.enum(PROVENANCE);
export const rightsSchema = z.enum(RIGHTS);
export const capabilitySchema = z.enum(CAPABILITIES);
const email = z
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
const password = z.string().min(12).max(128);
export const registerSchema = z
  .object({ email, password, name: z.string().trim().min(1).max(80) })
  .strict();
export const loginSchema = z
  .object({ email, password: z.string().min(1).max(128) })
  .strict();
export const emailSchema = z.object({ email }).strict();
export const resetSchema = z
  .object({ token: z.string().min(1).max(1024), newPassword: password })
  .strict();
export const tokenSchema = z
  .object({ token: z.string().min(1).max(2048) })
  .strict();
export const profileSchema = z
  .object({ displayName: z.string().trim().min(1).max(80) })
  .strict();
