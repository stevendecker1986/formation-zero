import type { Capability, Tier } from "@formation-zero/domain";
// Foundation mapping explicitly approved by the owner on 2026-09-04. No feature implementation.
const performance: readonly Capability[] = [
  "CAN_USE_FULL_LIBRARY",
  "CAN_USE_ADAPTIVE_PROGRAMMING",
  "CAN_USE_READINESS_ENGINE",
  "CAN_USE_ADVANCED_PROGRESS",
  "CAN_USE_RUN_TRACKING",
  "CAN_USE_RUCK_TRACKING",
];
const command: readonly Capability[] = [
  ...performance,
  "CAN_USE_UNIT_PT",
  "CAN_USE_LIVE_PT",
  "CAN_USE_FORMATION_ANALYTICS",
];
export const TIER_CAPABILITIES: Readonly<Record<Tier, readonly Capability[]>> =
  Object.freeze({
    BASE: Object.freeze([]),
    PERFORMANCE: Object.freeze(performance),
    COMMAND: Object.freeze(command),
  });
export function resolveCapabilities(tier: Tier): readonly Capability[] {
  return TIER_CAPABILITIES[tier];
}
export function hasCapability(tier: Tier, capability: Capability): boolean {
  return resolveCapabilities(tier).includes(capability);
}
export function assertCommercialActivationAllowed(): never {
  throw new Error("LEGAL_COMMERCIAL_GATE_CLOSED");
}
export const LEGAL_COMMERCIAL_GATE_APPROVED = false as const;
