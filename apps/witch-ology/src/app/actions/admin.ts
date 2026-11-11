"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { sql } from "@/lib/db";
import { clientAddress, enforceLimit } from "@/lib/http";
import { tokensMatch } from "@/lib/passwords";
import { isRecordId, readText, readTier } from "@/lib/text";
import { getViewer, requireAdmin } from "@/lib/viewer";

function slugFrom(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "course"}-${randomBytes(3).toString("hex")}`;
}

export async function claimAdmin(_state: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/admin/setup");
  const limited = await enforceLimit(`setup:${await clientAddress()}`, 5, 60 * 60 * 1000);
  if (limited) return { error: limited };
  const existing = await sql<{ id: string }>(`select id from users where role = 'admin' limit 1`);
  if (existing.length > 0) return { error: "An admin has already been set up." };
  const expected = process.env.ADMIN_SETUP_TOKEN?.trim() ?? "";
  if (!expected) return { error: "Admin setup is not configured." };
  const token = String(formData.get("token") ?? "");
  if (token.length === 0 || token.length > 200 || !tokensMatch(token, expected)) {
    return { error: "That setup token was not accepted." };
  }
  const updated = await sql<{ id: string }>(
    `update users set role = 'admin'
     where id = $1
       and role = 'learner'
       and not exists (select 1 from users where role = 'admin')
     returning id`,
    [viewer.user.id],
  );
  if (!updated[0]) return { error: "An admin has already been set up." };
  redirect("/admin");
}

export async function createCourse(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const title = readText(formData.get("title"), 140);
  const summary = readText(formData.get("summary"), 600);
  const minTier = readTier(formData.get("minTier"));
  if (!title) return { error: "Add a course title of 140 characters or fewer." };
  if (!summary) return { error: "Add a short summary of 600 characters or fewer." };
  if (!minTier) return { error: "Choose the lowest paid level that includes this course." };
  const id = randomUUID();
  const positionRows = await sql<{ position: number | string }>(`select coalesce(max(position), 0) + 1 as position from courses`);
  await sql(
    `insert into courses (id, slug, title, summary, min_tier, is_sample, position)
     values ($1, $2, $3, $4, $5, false, $6)`,
    [id, slugFrom(title), title, summary, minTier, Number(positionRows[0]?.position ?? 1)],
  );
  redirect(`/admin/courses/${id}`);
}

export async function updateCourse(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  if (!isRecordId(courseId)) return { error: "That course was not found." };
  const title = readText(formData.get("title"), 140);
  const summary = readText(formData.get("summary"), 600);
  const minTier = readTier(formData.get("minTier"));
  if (!title || !summary || !minTier) return { error: "Title, summary, and paid level are required." };
  const updated = await sql<{ id: string }>(
    `update courses set title = $2, summary = $3, min_tier = $4 where id = $1 returning id`,
    [courseId, title, summary, minTier],
  );
  if (!updated[0]) return { error: "That course was not found." };
  redirect(`/admin/courses/${courseId}?notice=saved`);
}

export async function addModule(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  if (!isRecordId(courseId)) return { error: "That course was not found." };
  const title = readText(formData.get("title"), 140);
  const summary = readText(formData.get("summary"), 600);
  if (!title || !summary) return { error: "A module needs a title and a summary." };
  const positionRows = await sql<{ position: number | string }>(
    `select coalesce(max(position), 0) + 1 as position from modules where course_id = $1`,
    [courseId],
  );
  await sql(
    `insert into modules (id, course_id, title, summary, position) values ($1, $2, $3, $4, $5)`,
    [randomUUID(), courseId, title, summary, Number(positionRows[0]?.position ?? 1)],
  );
  redirect(`/admin/courses/${courseId}?notice=saved`);
}

export async function deleteModule(formData: FormData): Promise<void> {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const moduleId = String(formData.get("moduleId") ?? "");
  if (!isRecordId(courseId) || !isRecordId(moduleId) || formData.get("confirm") !== "yes") {
    redirect(isRecordId(courseId) ? `/admin/courses/${courseId}` : "/admin");
  }
  await sql(`delete from modules where id = $1 and course_id = $2`, [moduleId, courseId]);
  redirect(`/admin/courses/${courseId}?notice=saved`);
}

export async function addLesson(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const moduleId = String(formData.get("moduleId") ?? "");
  if (!isRecordId(courseId) || !isRecordId(moduleId)) return { error: "That module was not found." };
  const title = readText(formData.get("title"), 140);
  const body = readText(formData.get("body"), 20000);
  if (!title || !body) return { error: "A lesson needs a title and lesson text of 20,000 characters or fewer." };
  const modules = await sql<{ id: string }>(`select id from modules where id = $1 and course_id = $2`, [moduleId, courseId]);
  if (!modules[0]) return { error: "That module was not found." };
  const positionRows = await sql<{ position: number | string }>(
    `select coalesce(max(position), 0) + 1 as position from lessons where module_id = $1`,
    [moduleId],
  );
  const lessonId = randomUUID();
  await sql(
    `insert into lessons (id, module_id, title, body, sensitive, position)
     values ($1, $2, $3, $4, $5, $6)`,
    [lessonId, moduleId, title, body, formData.get("sensitive") === "yes", Number(positionRows[0]?.position ?? 1)],
  );
  redirect(`/admin/lessons/${lessonId}?notice=saved`);
}

export async function updateLesson(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!isRecordId(lessonId)) return { error: "That lesson was not found." };
  const title = readText(formData.get("title"), 140);
  const body = readText(formData.get("body"), 20000);
  if (!title || !body) return { error: "A lesson needs a title and lesson text." };
  const updated = await sql<{ id: string }>(
    `update lessons set title = $2, body = $3, sensitive = $4 where id = $1 returning id`,
    [lessonId, title, body, formData.get("sensitive") === "yes"],
  );
  if (!updated[0]) return { error: "That lesson was not found." };
  redirect(`/admin/lessons/${lessonId}?notice=saved`);
}

export async function deleteLesson(formData: FormData): Promise<void> {
  await requireAdmin();
  const lessonId = String(formData.get("lessonId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!isRecordId(lessonId) || formData.get("confirm") !== "yes") redirect("/admin");
  await sql(`delete from lessons where id = $1`, [lessonId]);
  redirect(isRecordId(courseId) ? `/admin/courses/${courseId}?notice=saved` : "/admin");
}
