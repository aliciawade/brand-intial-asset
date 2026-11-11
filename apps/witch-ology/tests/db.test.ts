import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";

async function freshDb(): Promise<PGlite> {
  const db = new PGlite();
  const files = (await readdir("migrations")).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  return db;
}

describe("campus database", () => {
  it("counts repeated attempts inside one rate-limit window", async () => {
    const db = await freshDb();
    const windowStart = "2026-11-11T22:00:00.000Z";
    const statement = `insert into rate_limits (bucket, hits, window_start)
       values ($1, 1, $2)
       on conflict (bucket) do update
         set hits = case
           when rate_limits.window_start = excluded.window_start then rate_limits.hits + 1
           else 1
         end,
         window_start = excluded.window_start
       returning hits`;
    await db.query(statement, ["login:test", windowStart]);
    const second = await db.query<{ hits: number | string }>(statement, ["login:test", windowStart]);
    assert.equal(Number(second.rows[0]?.hits), 2);
  });

  it("stores a lesson as text and keeps a sensitive flag false", async () => {
    const db = await freshDb();
    await db.query(
      `insert into users (id, email, password_hash, password_salt, age_confirmed_at)
       values ('user-1', 'learner@example.com', 'hash', 'salt', now())`,
    );
    await db.query(
      `insert into courses (id, slug, title, summary, min_tier, is_sample, position)
       values ('course-1', 'sample', 'Sample', 'A summary', 'welcome', true, 1)`,
    );
    await db.query(
      `insert into modules (id, course_id, title, summary, position)
       values ('module-1', 'course-1', 'Module', 'Summary', 1)`,
    );
    await db.query(
      `insert into lessons (id, module_id, title, body, sensitive, position)
       values ('lesson-1', 'module-1', 'Lesson', 'Plain lesson text', false, 1)`,
    );
    const lessons = await db.query<{ body: string; sensitive: boolean | string }>(
      `select body, sensitive from lessons where id = 'lesson-1'`,
    );
    assert.equal(lessons.rows[0]?.body, "Plain lesson text");
    assert.equal(lessons.rows[0]?.sensitive, false);
  });
});
