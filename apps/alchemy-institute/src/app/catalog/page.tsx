import type { Metadata } from "next";
import { Notice } from "@/components/notice";
import { tierById } from "@/lib/brand";
import { listCourses } from "@/lib/catalog";
import { requireUser, viewerCanAccess } from "@/lib/viewer";

export const metadata: Metadata = { title: "Catalog" };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const viewer = await requireUser("/catalog");
  const courses = await listCourses(viewer.user.id);
  return (
    <section className="stack">
      <div className="section-head">
        <h1>Catalog</h1>
        <p>Course titles are listed here. Lesson text opens when your paid level includes the course.</p>
      </div>
      <Notice notice={params.notice} />
      {courses.length === 0 ? <p>No courses have been published yet.</p> : null}
      <div className="card-grid">
        {courses.map((course) => {
          const allowed = viewerCanAccess(viewer, course.minTier);
          const level = tierById(course.minTier)?.name ?? "a paid level";
          return (
            <article className="card" key={course.id}>
              {course.sample ? <p className="badge">Sample</p> : null}
              <h2>{course.title}</h2>
              <p>{course.summary}</p>
              <p>{allowed ? `Included with your plan. ${course.completedCount} of ${course.lessonCount} lessons complete.` : `Included with ${level} and above.`}</p>
              <a className="button secondary" href={`/courses/${course.id}`}>{allowed ? "Open course" : "View course"}</a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
