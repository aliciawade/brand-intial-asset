import type { Metadata } from "next";
import { createCourse } from "@/app/actions/admin";
import { PendingForm } from "@/components/forms";
import { brand, tierById } from "@/lib/brand";
import { listCourses } from "@/lib/catalog";
import { requireAdmin } from "@/lib/viewer";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const viewer = await requireAdmin();
  const courses = await listCourses(viewer.user.id);
  return (
    <section className="stack">
      <div className="section-head">
        <h1>Catalog editing</h1>
        <p>Add a course, then give it modules and lessons. Lesson text is stored as plain text.</p>
      </div>
      <div className="card-grid">
        <div className="panel">
          <h2>New course</h2>
          <PendingForm action={createCourse} submitLabel="Create course">
            <label>
              Title
              <input name="title" type="text" required maxLength={140} />
            </label>
            <label>
              Summary
              <textarea name="summary" required maxLength={600} />
            </label>
            <label>
              Lowest paid level
              <select name="minTier" defaultValue="welcome">
                {brand.tiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>{tier.name}</option>
                ))}
              </select>
            </label>
          </PendingForm>
        </div>
        <div className="stack">
          {courses.map((course) => (
            <article className="card" key={course.id}>
              <h2>{course.title}</h2>
              <p>{tierById(course.minTier)?.name} · {course.lessonCount} lessons</p>
              <a href={`/admin/courses/${course.id}`}>Edit course</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
