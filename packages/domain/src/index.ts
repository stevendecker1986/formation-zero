export const ROLES = [
  "USER",
  "LEADER",
  "COACH_FFI",
  "FORMATION_ADMIN",
  "PLATFORM_ADMIN",
] as const;
export type Role = (typeof ROLES)[number];
export const TIERS = ["BASE", "PERFORMANCE", "COMMAND"] as const;
export type Tier = (typeof TIERS)[number];
export const ENVIRONMENTS = ["LOCAL", "TEST", "STAGING", "PRODUCTION"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];
export const CONTENT_STATUSES = [
  "DISCOVERED",
  "INGESTED",
  "SOURCE_VERIFIED",
  "TECHNICALLY_REVIEWED",
  "SAFETY_REVIEWED",
  "EDITORIALLY_REVIEWED",
  "APPROVED",
  "PUBLISHED",
  "SUPERSEDED",
  "RETIRED",
] as const;
export const PROVENANCE = [
  "OFFICIAL",
  "OFFICIAL_DERIVED",
  "FZ_DERIVED",
  "FZ_ORIGINAL",
  "SUPPORTING_EVIDENCE",
] as const;
export type Provenance = (typeof PROVENANCE)[number];
export const RIGHTS = [
  "FORMATION_ZERO_ORIGINAL",
  "US_GOVERNMENT_WORK_VERIFIED",
  "PUBLIC_DOMAIN_VERIFIED",
  "LICENSED",
  "PERMISSION_GRANTED",
  "THIRD_PARTY_COPYRIGHT",
  "UNKNOWN",
] as const;
export const DATA_DOMAINS = [
  "ACCOUNT",
  "FITNESS",
  "SENSITIVE_HEALTH_ADJACENT",
  "LOCATION",
  "FORMATION",
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export type Rights = (typeof RIGHTS)[number];
export const CAPABILITIES = [
  "CAN_USE_FULL_LIBRARY",
  "CAN_USE_ADAPTIVE_PROGRAMMING",
  "CAN_USE_READINESS_ENGINE",
  "CAN_USE_ADVANCED_PROGRESS",
  "CAN_USE_RUN_TRACKING",
  "CAN_USE_RUCK_TRACKING",
  "CAN_USE_UNIT_PT",
  "CAN_USE_LIVE_PT",
  "CAN_USE_FORMATION_ANALYTICS",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

// Necessary foundation conditions only; this is not a publication workflow or legal approval.
export function isPublishable(input: {
  status: ContentStatus;
  rights: Rights;
  rightsEvidenceVerified: boolean;
}): boolean {
  return (
    (input.status === "APPROVED" || input.status === "PUBLISHED") &&
    input.rightsEvidenceVerified &&
    input.rights !== "UNKNOWN" &&
    input.rights !== "THIRD_PARTY_COPYRIGHT"
  );
}
export interface Identity {
  userId: string;
}
export interface AuthorizationContext {
  identity: Identity;
  roles: readonly Role[];
  tier: Tier;
}
// No resource domain or grants exist in Phase A; subscriptions cannot imply access.
export function hasResourcePermission(
  _identity: Identity,
  _resourceId: string,
): boolean {
  return false;
}
export function hasRole(context: AuthorizationContext, role: Role): boolean {
  return context.roles.includes(role);
}
