import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ROLES,
  TIERS,
  CAPABILITIES,
  RIGHTS,
  CONTENT_STATUSES,
  PROVENANCE,
  ENVIRONMENTS,
  isPublishable,
  hasResourcePermission,
  hasRole,
} from "@formation-zero/domain";
import {
  roleSchema,
  tierSchema,
  rightsSchema,
  contentStatusSchema,
  provenanceSchema,
  environmentSchema,
  capabilitySchema,
  registerSchema,
  profileSchema,
} from "@formation-zero/schemas";
import { loadConfig } from "@formation-zero/config";
import {
  TIER_CAPABILITIES,
  resolveCapabilities,
  hasCapability,
  LEGAL_COMMERCIAL_GATE_APPROVED,
  assertCommercialActivationAllowed,
} from "@formation-zero/entitlements";
import { createLogger } from "../services/api/src/logging.js";
test("exact domain enums and runtime schemas reject unknown values", () => {
  assert.deepEqual(ROLES, [
    "USER",
    "LEADER",
    "COACH_FFI",
    "FORMATION_ADMIN",
    "PLATFORM_ADMIN",
  ]);
  assert.deepEqual(TIERS, ["BASE", "PERFORMANCE", "COMMAND"]);
  for (const [values, schema] of [
    [ROLES, roleSchema],
    [TIERS, tierSchema],
    [RIGHTS, rightsSchema],
    [CONTENT_STATUSES, contentStatusSchema],
    [PROVENANCE, provenanceSchema],
    [ENVIRONMENTS, environmentSchema],
    [CAPABILITIES, capabilitySchema],
  ] as const) {
    for (const value of values)
      assert.equal(schema.safeParse(value).success, true);
    assert.equal(schema.safeParse("INVENTED").success, false);
  }
});
test("owner-approved centralized entitlement mapping and role/resource separation", () => {
  assert.equal(resolveCapabilities("BASE").length, 0);
  assert.equal(resolveCapabilities("PERFORMANCE").length, 6);
  assert.equal(resolveCapabilities("COMMAND").length, 9);
  for (const capability of resolveCapabilities("PERFORMANCE"))
    assert.equal(hasCapability("COMMAND", capability), true);
  assert.equal(hasCapability("PERFORMANCE", "CAN_USE_UNIT_PT"), false);
  assert.equal(hasCapability("COMMAND", "CAN_USE_UNIT_PT"), true);
  assert.equal(hasResourcePermission({ userId: "a" }, "formation"), false);
  assert.equal(
    hasRole(
      { identity: { userId: "a" }, roles: ["USER"], tier: "COMMAND" },
      "PLATFORM_ADMIN",
    ),
    false,
  );
  assert.ok(Object.isFrozen(TIER_CAPABILITIES.COMMAND));
});
test("commercial activation cannot be enabled", () => {
  assert.equal(LEGAL_COMMERCIAL_GATE_APPROVED, false);
  assert.throws(
    assertCommercialActivationAllowed,
    /LEGAL_COMMERCIAL_GATE_CLOSED/,
  );
});
test("publishability denies unknown/unverified/third-party rights and unapproved content", () => {
  for (const status of CONTENT_STATUSES)
    assert.equal(
      isPublishable({
        status,
        rights: "UNKNOWN",
        rightsEvidenceVerified: true,
      }),
      false,
    );
  assert.equal(
    isPublishable({
      status: "APPROVED",
      rights: "LICENSED",
      rightsEvidenceVerified: false,
    }),
    false,
  );
  assert.equal(
    isPublishable({
      status: "APPROVED",
      rights: "THIRD_PARTY_COPYRIGHT",
      rightsEvidenceVerified: true,
    }),
    false,
  );
  assert.equal(
    isPublishable({
      status: "DISCOVERED",
      rights: "FORMATION_ZERO_ORIGINAL",
      rightsEvidenceVerified: true,
    }),
    false,
  );
  assert.equal(
    isPublishable({
      status: "APPROVED",
      rights: "FORMATION_ZERO_ORIGINAL",
      rightsEvidenceVerified: true,
    }),
    true,
  );
});
test("configuration fails fast without leaking invalid secrets and rejects commercial true", () => {
  assert.throws(() => loadConfig({}), /Invalid server configuration/);
  const valid = {
    APP_ENV: "LOCAL",
    DATABASE_URL: "postgresql://localhost/example",
    AUTH_SECRET: "x".repeat(48),
    API_ORIGIN: "http://localhost:4000",
    WEB_ORIGIN: "http://localhost:3000",
    ADMIN_ORIGIN: "http://localhost:3001",
    MAIL_MODE: "LOCAL",
  };
  assert.equal(loadConfig(valid).LEGAL_COMMERCIAL_GATE_APPROVED, "false");
  assert.throws(() =>
    loadConfig({ ...valid, LEGAL_COMMERCIAL_GATE_APPROVED: "true" }),
  );
  assert.throws(() => loadConfig({ ...valid, APP_ENV: "PRODUCTION" }));
  assert.throws(
    () => loadConfig({ ...valid, AUTH_SECRET: "do-not-leak-me" }),
    (error) =>
      error instanceof Error && !error.message.includes("do-not-leak-me"),
  );
});
test("payload schemas deny role/entitlement and health fields", () => {
  const body = {
    email: "test@example.invalid",
    password: "Synthetic-test-password!",
    name: "Synthetic",
  };
  for (const extra of [
    { roles: ["PLATFORM_ADMIN"] },
    { tier: "COMMAND" },
    { enabled: true },
    { rank: "invented" },
    { fitness: 10 },
  ])
    assert.equal(
      registerSchema.safeParse({ ...body, ...extra }).success,
      false,
    );
  assert.equal(
    profileSchema.safeParse({ displayName: "name", tier: "COMMAND" }).success,
    false,
  );
});
test("logging is allowlisted and excludes arbitrary secret-bearing metadata", () => {
  const lines: string[] = [];
  const log = createLogger((line) => lines.push(line));
  const input = {
    level: "info" as const,
    event: "request.completed" as const,
    requestId: "req",
    password: "never-log-this",
    metadata: { token: "secret-token" },
    url: "/?token=secret-token",
  };
  log(input);
  assert.ok(lines[0]?.includes("timestamp"));
  assert.ok(!lines.join("").includes("secret-token"));
  assert.ok(!lines.join("").includes("never-log-this"));
});
