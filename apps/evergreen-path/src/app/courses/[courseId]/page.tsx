import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tierById } from "@/lib/brand";
import { getCourseOutline } from "@/lib/catalog";
import { isRecordId } from "@/lib/text";
import { requireUser, viewerCanAccess } from "@/lib/viewer";

export const metadata: Metadata = { title: "Course" };

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  if (!isRecordId(courseId)) notFound();
  const viewer = await requireUser(`/courses/${courseId}`);
  const course = await getCourseOutline(courseId, viewer.user.id);
  if (!course) notFound();
  const allowed = viewerCanAccess(viewer, course.minTier);
  const level = tierById(course.minTier)?.name ?? "a paid level";
  return (
    <article className="stack">
      {course.sample ? <p className="badge">Sample</p> : null}
      <div className="section-head">
        <h1>{course.title}</h1>
        <p>{course.summary}</p>
        <p>{allowed ? "Your plan includes this course." : `Lesson text opens with ${level} and above.`}</p>
      </div>
      {course.modules.map((module) => (
        <section className="panel" key={module.id}>
          <h2>{module.title}</h2>
          <p>{module.summary}</p>
          <ul className="list">
            {module.lessons.map((lesson) => (
              <li key={lesson.id}>
                <a href={`/lessons/${lesson.id}`}>{lesson.title}</a>
                {lesson.completedAt ? <span className="done"> · Complete</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!allowed ? <a className="button" href="/billing">See paid levels</a> : null}
    </article>
  );
}
