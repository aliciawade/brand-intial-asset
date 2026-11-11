import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const FIXED_SALT = Buffer.alloc(16, 7);
let fixedHash: Buffer | null = null;

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(password, salt, 32)) as Buffer;
  return { salt: salt.toString("base64"), hash: hash.toString("base64") };
}

export async function verifyPassword(password: string, saltB64: string, hashB64: string): Promise<boolean> {
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function wastePasswordWork(password: string): Promise<void> {
  fixedHash ??= (await scryptAsync("not-a-real-password", FIXED_SALT, 32)) as Buffer;
  const actual = (await scryptAsync(password, FIXED_SALT, 32)) as Buffer;
  timingSafeEqual(actual, fixedHash);
}

export function tokensMatch(given: string, expected: string): boolean {
  const left = Buffer.from(given);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}
