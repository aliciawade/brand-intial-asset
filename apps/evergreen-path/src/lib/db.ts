import "server-only";
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

const globalDb = globalThis as unknown as {
  campusPool?: pg.Pool;
  campusLocal?: Promise<PGlite>;
};

export function databaseConfigured(): boolean {
  return databaseUrl !== "";
}

export async function sql<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  if (databaseUrl !== "") {
    globalDb.campusPool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await globalDb.campusPool.query(text, params)).rows as T[];
  }
  globalDb.campusLocal ??= startLocal().catch((error: unknown) => {
    globalDb.campusLocal = undefined;
    throw error;
  });
  return (await (await globalDb.campusLocal).query<T>(text, params)).rows;
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite();
  const files = (await readdir("migrations").catch(() => [])).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  return db;
}
