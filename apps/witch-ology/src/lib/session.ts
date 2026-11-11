import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "./db";

const COOKIE = "campus_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + THIRTY_DAYS_MS);
  await sql(
    `insert into sessions (id, user_id, token_hash, expires_at) values ($1, $2, $3, $4)`,
    [randomUUID(), userId, hashToken(token), expires.toISOString()],
  );
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await sql(`delete from sessions where token_hash = $1`, [hashToken(token)]);
  }
  jar.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function sessionTokenHash(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token || token.length > 200) return null;
  return hashToken(token);
}
