import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { markComplete } from "@/app/actions/progress";
import { tierById } from "@/lib/brand";
import { getLesson } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { isRecordId } from "@/lib/text";
import { requireUser, viewerCanAccess } from "@/lib/viewer";

export const metadata: Metadata = { title: "Lesson" };

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  if (!isRecordId(lessonId)) notFound();
  const viewer = await requireUser(`/lessons/${lessonId}`);
  const gate = await getLesson(lessonId, viewer.user.id, false);
  if (!gate) notFound();
  const allowed = viewerCanAccess(viewer, gate.minTier);
  const lesson = allowed ? await getLesson(lessonId, viewer.user.id, true) : gate;
  if (!lesson) notFound();
  const level = tierById(lesson.minTier)?.name ?? "a paid level";

  return (
    <article className="lesson">
      <p className="eyebrow"><a href={`/courses/${lesson.courseId}`}>{lesson.courseTitle}</a></p>
      <h1>{lesson.title}</h1>
      {allowed && lesson.sensitive ? (
        <p className="care">
          If this material brings up distress, call or text 988 in the US, or call 911 if you are in immediate danger. This lesson is education and enrichment, not a crisis service or therapy.
        </p>
      ) : null}
      {allowed && lesson.body ? <div className="lesson-body">{lesson.body}</div> : null}
      {!allowed ? (
        <>
          <p>This lesson is included with {level} and above. The lesson text stays closed until that paid plan is active.</p>
          <a className="button" href="/billing">See paid levels</a>
        </>
      ) : null}
      {allowed && lesson.completedAt ? <p>Completed {formatDate(lesson.completedAt)}.</p> : null}
      {allowed && !lesson.completedAt ? (
        <form action={markComplete}>
          <input type="hidden" name="lessonId" value={lesson.id} />
          <button className="button" type="submit">Mark complete</button>
        </form>
      ) : null}
    </article>
  );
}
