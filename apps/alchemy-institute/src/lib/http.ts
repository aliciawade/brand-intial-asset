import "server-only";
import { headers } from "next/headers";
import { sql } from "./db";

export async function clientAddress(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const address = (forwarded || headerStore.get("x-real-ip") || "local").slice(0, 64);
  return address.replace(/[^\w.:-]/g, "") || "local";
}

export async function requestOrigin(): Promise<string> {
  const headerStore = await headers();
  const host = (headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "").trim();
  const proto = (headerStore.get("x-forwarded-proto") ?? "http").split(",")[0]?.trim();
  if (!host || host.length > 200 || !/^[a-zA-Z0-9.:-]+$/.test(host)) {
    throw new Error("The request host was not accepted.");
  }
  if (proto !== "http" && proto !== "https") {
    throw new Error("The request protocol was not accepted.");
  }
  return `${proto}://${host}`;
}

export async function enforceLimit(bucket: string, limit: number, windowMs: number): Promise<string | null> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();
  const rows = await sql<{ hits: number | string }>(
    `insert into rate_limits (bucket, hits, window_start)
     values ($1, 1, $2)
     on conflict (bucket) do update
       set hits = case
         when rate_limits.window_start = excluded.window_start then rate_limits.hits + 1
         else 1
       end,
       window_start = excluded.window_start
     returning hits`,
    [bucket, windowStart],
  );
  const hits = Number(rows[0]?.hits ?? 0);
  if (hits > limit) return "Too many attempts. Wait a little while and try again.";
  return null;
}
