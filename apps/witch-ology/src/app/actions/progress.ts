"use server";

import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { isRecordId } from "@/lib/text";
import { requireUser, viewerCanAccess } from "@/lib/viewer";

export async function markComplete(formData: FormData): Promise<void> {
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!isRecordId(lessonId)) redirect("/catalog");
  const viewer = await requireUser(`/lessons/${lessonId}`);
  const rows = await sql<{ min_tier: string }>(
    `select c.min_tier
     from lessons l
     join modules m on m.id = l.module_id
     join courses c on c.id = m.course_id
     where l.id = $1`,
    [lessonId],
  );
  const lesson = rows[0];
  if (!lesson || !viewerCanAccess(viewer, lesson.min_tier)) redirect("/billing");
  await sql(
    `insert into progress (user_id, lesson_id) values ($1, $2)
     on conflict (user_id, lesson_id) do nothing`,
    [viewer.user.id, lessonId],
  );
  redirect(`/lessons/${lessonId}`);
}
