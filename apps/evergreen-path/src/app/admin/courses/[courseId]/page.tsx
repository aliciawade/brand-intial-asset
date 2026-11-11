import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { addLesson, addModule, deleteModule, updateCourse } from "@/app/actions/admin";
import { PendingForm } from "@/components/forms";
import { Notice } from "@/components/notice";
import { brand } from "@/lib/brand";
import { getCourseOutline } from "@/lib/catalog";
import { isRecordId } from "@/lib/text";
import { requireAdmin } from "@/lib/viewer";

export const metadata: Metadata = { title: "Edit course" };

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { courseId } = await params;
  const query = await searchParams;
  if (!isRecordId(courseId)) notFound();
  const viewer = await requireAdmin();
  const course = await getCourseOutline(courseId, viewer.user.id);
  if (!course) notFound();

  return (
    <section className="stack">
      <p className="eyebrow"><a href="/admin">Catalog editing</a></p>
      <h1>{course.title}</h1>
      <Notice notice={query.notice} />
      <div className="panel">
        <h2>Course details</h2>
        <PendingForm action={updateCourse} submitLabel="Save course">
          <input type="hidden" name="courseId" value={course.id} />
          <label>
            Title
            <input name="title" type="text" required maxLength={140} defaultValue={course.title} />
          </label>
          <label>
            Summary
            <textarea name="summary" required maxLength={600} defaultValue={course.summary} />
          </label>
          <label>
            Lowest paid level
            <select name="minTier" defaultValue={course.minTier}>
              {brand.tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>{tier.name}</option>
              ))}
            </select>
          </label>
        </PendingForm>
      </div>
      {course.modules.map((module) => (
        <section className="panel stack" key={module.id}>
          <h2>{module.title}</h2>
          <p>{module.summary}</p>
          <ul className="list">
            {module.lessons.map((lesson) => (
              <li key={lesson.id}><a href={`/admin/lessons/${lesson.id}`}>{lesson.title}</a></li>
            ))}
          </ul>
          <h3>Add a lesson</h3>
          <PendingForm action={addLesson} submitLabel="Add lesson">
            <input type="hidden" name="courseId" value={course.id} />
            <input type="hidden" name="moduleId" value={module.id} />
            <label>
              Title
              <input name="title" type="text" required maxLength={140} />
            </label>
            <label>
              Lesson text
              <textarea name="body" required maxLength={20000} />
            </label>
            <label className="choice">
              <input name="sensitive" type="checkbox" value="yes" />
              <span>Show the 988 / 911 care note. Use this when the lesson may stir hard feelings.</span>
            </label>
          </PendingForm>
          <form action={deleteModule}>
            <input type="hidden" name="courseId" value={course.id} />
            <input type="hidden" name="moduleId" value={module.id} />
            <label className="choice">
              <input name="confirm" type="checkbox" value="yes" required />
              <span>Remove this module and its lessons.</span>
            </label>
            <button className="button secondary" type="submit">Remove module</button>
          </form>
        </section>
      ))}
      <div className="panel">
        <h2>Add a module</h2>
        <PendingForm action={addModule} submitLabel="Add module">
          <input type="hidden" name="courseId" value={course.id} />
          <label>
            Title
            <input name="title" type="text" required maxLength={140} />
          </label>
          <label>
            Summary
            <textarea name="summary" required maxLength={600} />
          </label>
        </PendingForm>
      </div>
    </section>
  );
}
