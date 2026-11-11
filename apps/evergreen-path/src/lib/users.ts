import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "./db";
import { hashPassword, verifyPassword, wastePasswordWork } from "./passwords";
import { readEmail, readPassword } from "./text";

const INVALID = "Email or password is incorrect.";

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "23505";
}

export async function registerUser(input: {
  email: string;
  password: string;
  ageConfirmed: boolean;
}): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  if (!input.ageConfirmed) {
    return { ok: false, error: "Confirm that you are 18 or older to create an account." };
  }
  const email = readEmail(input.email);
  if (!email) return { ok: false, error: "Enter a valid email address." };
  const password = readPassword(input.password);
  if (!password) return { ok: false, error: "Use a password of at least 10 characters." };

  const { salt, hash } = await hashPassword(password);
  const userId = randomUUID();
  try {
    await sql(
      `insert into users (id, email, password_hash, password_salt, age_confirmed_at)
       values ($1, $2, $3, $4, now())`,
      [userId, email, hash, salt],
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "An account with that email already exists." };
    }
    throw error;
  }
  return { ok: true, userId };
}

export async function authenticate(
  emailRaw: string,
  passwordRaw: string,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const email = readEmail(emailRaw);
  const password = typeof passwordRaw === "string" ? passwordRaw : "";
  if (!email || password.length === 0 || password.length > 200) {
    await wastePasswordWork(password || "incorrect");
    return { ok: false, error: INVALID };
  }
  const rows = await sql<{ id: string; password_hash: string; password_salt: string }>(
    `select id, password_hash, password_salt from users where email = $1`,
    [email],
  );
  const user = rows[0];
  if (!user) {
    await wastePasswordWork(password);
    return { ok: false, error: INVALID };
  }
  const matches = await verifyPassword(password, user.password_salt, user.password_hash);
  if (!matches) return { ok: false, error: INVALID };
  return { ok: true, userId: user.id };
}
