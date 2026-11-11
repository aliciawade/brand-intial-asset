import "server-only";
import { brand } from "./brand";
import { sql } from "./db";

const globalSeed = globalThis as unknown as { campusSeeded?: Promise<void> };

export function ensureSeed(): Promise<void> {
  globalSeed.campusSeeded ??= seed().catch((error: unknown) => {
    globalSeed.campusSeeded = undefined;
    throw error;
  });
  return globalSeed.campusSeeded;
}

async function seed(): Promise<void> {
  const slug = `${brand.slug}-sample`;
  const courseId = `${brand.slug}-sample-course`;
  await sql(
    `insert into courses (id, slug, title, summary, min_tier, is_sample, position)
     values ($1, $2, $3, $4, $5, true, 1)
     on conflict (slug) do nothing`,
    [courseId, slug, brand.sampleCourse.title, brand.sampleCourse.summary, brand.sampleCourse.minTier],
  );
  const courses = await sql<{ id: string }>(`select id from courses where slug = $1`, [slug]);
  const savedCourseId = courses[0]?.id;
  if (!savedCourseId) return;

  for (const [moduleIndex, module] of brand.sampleCourse.modules.entries()) {
    const moduleId = `${brand.slug}-sample-m${moduleIndex + 1}`;
    await sql(
      `insert into modules (id, course_id, title, summary, position)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do nothing`,
      [moduleId, savedCourseId, module.title, module.summary, moduleIndex + 1],
    );
    for (const [lessonIndex, lesson] of module.lessons.entries()) {
      const lessonId = `${moduleId}-l${lessonIndex + 1}`;
      await sql(
        `insert into lessons (id, module_id, title, body, sensitive, position)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (id) do nothing`,
        [lessonId, moduleId, lesson.title, lesson.body, Boolean(lesson.sensitive), lessonIndex + 1],
      );
    }
  }
}
