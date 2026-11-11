import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteLesson, updateLesson } from "@/app/actions/admin";
import { PendingForm } from "@/components/forms";
import { Notice } from "@/components/notice";
import { sql } from "@/lib/db";
import { asBoolean, isRecordId } from "@/lib/text";
import { requireAdmin } from "@/lib/viewer";

export const metadata: Metadata = { title: "Edit lesson" };

export default async function EditLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { lessonId } = await params;
  const query = await searchParams;
  if (!isRecordId(lessonId)) notFound();
  await requireAdmin();
  const rows = await sql<{
    id: string;
    title: string;
    body: string;
    sensitive: boolean;
    course_id: string;
  }>(
    `select l.id, l.title, l.body, l.sensitive, m.course_id
     from lessons l
     join modules m on m.id = l.module_id
     where l.id = $1`,
    [lessonId],
  );
  const lesson = rows[0];
  if (!lesson) notFound();

  return (
    <section className="narrow">
      <p className="eyebrow"><a href={`/admin/courses/${lesson.course_id}`}>Back to the course</a></p>
      <h1>Edit lesson</h1>
      <Notice notice={query.notice} />
      <PendingForm action={updateLesson} submitLabel="Save lesson">
        <input type="hidden" name="lessonId" value={lesson.id} />
        <label>
          Title
          <input name="title" type="text" required maxLength={140} defaultValue={lesson.title} />
        </label>
        <label>
          Lesson text
          <textarea name="body" required maxLength={20000} defaultValue={lesson.body} />
        </label>
        <label className="choice">
          <input name="sensitive" type="checkbox" value="yes" defaultChecked={asBoolean(lesson.sensitive)} />
          <span>Show the 988 / 911 care note.</span>
        </label>
      </PendingForm>
      <form action={deleteLesson} className="stack">
        <input type="hidden" name="lessonId" value={lesson.id} />
        <input type="hidden" name="courseId" value={lesson.course_id} />
        <label className="choice">
          <input name="confirm" type="checkbox" value="yes" required />
          <span>Remove this lesson.</span>
        </label>
        <button className="button secondary" type="submit">Remove lesson</button>
      </form>
    </section>
  );
}
