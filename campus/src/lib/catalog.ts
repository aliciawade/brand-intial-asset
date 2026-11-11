import "server-only";
import { sql } from "./db";
import { asBoolean } from "./text";

export type CourseCard = {
  id: string;
  title: string;
  summary: string;
  minTier: string;
  sample: boolean;
  lessonCount: number;
  completedCount: number;
};

export type OutlineLesson = {
  id: string;
  title: string;
  position: number;
  completedAt: string | null;
};

export type OutlineModule = {
  id: string;
  title: string;
  summary: string;
  position: number;
  lessons: OutlineLesson[];
};

export type CourseOutline = {
  id: string;
  title: string;
  summary: string;
  minTier: string;
  sample: boolean;
  modules: OutlineModule[];
};

export type LessonView = {
  id: string;
  title: string;
  body: string | null;
  sensitive: boolean;
  courseId: string;
  courseTitle: string;
  minTier: string;
  completedAt: string | null;
};

function asNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function asText(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function listCourses(userId: string): Promise<CourseCard[]> {
  const rows = await sql<{
    id: string;
    title: string;
    summary: string;
    min_tier: string;
    is_sample: boolean;
    lesson_count: number | string;
    completed_count: number | string;
  }>(
    `select c.id, c.title, c.summary, c.min_tier, c.is_sample,
            count(l.id) as lesson_count,
            count(p.lesson_id) as completed_count
     from courses c
     left join modules m on m.course_id = c.id
     left join lessons l on l.module_id = m.id
     left join progress p on p.lesson_id = l.id and p.user_id = $1
     group by c.id
     order by c.position, c.title`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    minTier: row.min_tier,
    sample: asBoolean(row.is_sample),
    lessonCount: asNumber(row.lesson_count),
    completedCount: asNumber(row.completed_count),
  }));
}

export async function getCourseOutline(courseId: string, userId: string): Promise<CourseOutline | null> {
  const courses = await sql<{
    id: string;
    title: string;
    summary: string;
    min_tier: string;
    is_sample: boolean;
  }>(`select id, title, summary, min_tier, is_sample from courses where id = $1`, [courseId]);
  const course = courses[0];
  if (!course) return null;
  const rows = await sql<{
    module_id: string;
    module_title: string;
    module_summary: string;
    module_position: number;
    lesson_id: string | null;
    lesson_title: string | null;
    lesson_position: number | null;
    completed_at: string | Date | null;
  }>(
    `select m.id as module_id, m.title as module_title, m.summary as module_summary, m.position as module_position,
            l.id as lesson_id, l.title as lesson_title, l.position as lesson_position, p.completed_at
     from modules m
     left join lessons l on l.module_id = m.id
     left join progress p on p.lesson_id = l.id and p.user_id = $2
     where m.course_id = $1
     order by m.position, l.position`,
    [courseId, userId],
  );
  const modules = new Map<string, OutlineModule>();
  for (const row of rows) {
    const current = modules.get(row.module_id) ?? {
      id: row.module_id,
      title: row.module_title,
      summary: row.module_summary,
      position: row.module_position,
      lessons: [],
    };
    if (row.lesson_id && row.lesson_title) {
      current.lessons.push({
        id: row.lesson_id,
        title: row.lesson_title,
        position: row.lesson_position ?? 0,
        completedAt: asText(row.completed_at),
      });
    }
    modules.set(row.module_id, current);
  }
  return {
    id: course.id,
    title: course.title,
    summary: course.summary,
    minTier: course.min_tier,
    sample: asBoolean(course.is_sample),
    modules: [...modules.values()],
  };
}

export async function getLesson(lessonId: string, userId: string, includeBody: boolean): Promise<LessonView | null> {
  const rows = await sql<{
    id: string;
    title: string;
    body: string;
    sensitive: boolean;
    course_id: string;
    course_title: string;
    min_tier: string;
    completed_at: string | Date | null;
  }>(
    `select l.id, l.title, ${includeBody ? "l.body" : "''"} as body, l.sensitive,
            c.id as course_id, c.title as course_title, c.min_tier,
            p.completed_at
     from lessons l
     join modules m on m.id = l.module_id
     join courses c on c.id = m.course_id
     left join progress p on p.lesson_id = l.id and p.user_id = $2
     where l.id = $1`,
    [lessonId, userId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    body: includeBody ? row.body : null,
    sensitive: asBoolean(row.sensitive),
    courseId: row.course_id,
    courseTitle: row.course_title,
    minTier: row.min_tier,
    completedAt: asText(row.completed_at),
  };
}

export async function sampleCourse(): Promise<{ title: string; summary: string } | null> {
  const rows = await sql<{ title: string; summary: string }>(
    `select title, summary from courses where is_sample = true order by position limit 1`,
  );
  return rows[0] ?? null;
}
