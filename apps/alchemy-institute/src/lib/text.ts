import { TIER_ORDER, type TierId } from "./brand-types";

export function readText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (!text || text.length > max) return null;
  return text;
}

export function readEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function readPassword(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.length < 10 || value.length > 200) return null;
  return value;
}

export function readTier(value: unknown): TierId | null {
  if (typeof value !== "string") return null;
  if ((TIER_ORDER as readonly string[]).includes(value)) return value as TierId;
  return null;
}

export function readInterval(value: unknown): "month" | "year" | null {
  if (value === "month" || value === "year") return value;
  return null;
}

export function isRecordId(value: string): boolean {
  return /^[a-zA-Z0-9-]{1,80}$/.test(value);
}

export function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "t" || value === "true";
}

export function safeLog(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown";
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://redacted");
}
