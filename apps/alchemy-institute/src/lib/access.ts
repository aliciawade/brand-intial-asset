import { TIER_ORDER, type TierId } from "./brand-types";

export const TIER_RANK: Record<TierId, number> = {
  welcome: 1,
  member: 2,
  inner: 3,
  crown: 4,
};

export type AccessInput = {
  role: "learner" | "admin";
  status: string | null;
  tier: string | null;
  periodEnd: Date | string | null;
  minTier: string;
  now?: Date;
};

export function rankOf(tier: string | null | undefined): number {
  if (!tier || !(tier in TIER_RANK)) return 0;
  return TIER_RANK[tier as TierId];
}

export function isTierId(value: string): value is TierId {
  return (TIER_ORDER as readonly string[]).includes(value);
}

export function canAccessCourse(input: AccessInput): boolean {
  if (input.role === "admin") return true;
  if (input.status !== "active" && input.status !== "trialing") return false;
  const have = rankOf(input.tier);
  const need = rankOf(input.minTier);
  if (have === 0 || need === 0 || have < need) return false;
  if (input.periodEnd) {
    const end = new Date(input.periodEnd);
    const now = input.now ?? new Date();
    if (Number.isNaN(end.getTime()) || end.getTime() <= now.getTime()) return false;
  }
  return true;
}
