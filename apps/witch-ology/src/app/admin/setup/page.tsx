import type { Metadata } from "next";
import { claimAdmin } from "@/app/actions/admin";
import { PendingForm } from "@/components/forms";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/viewer";

export const metadata: Metadata = { title: "Admin setup" };

export default async function AdminSetupPage() {
  const viewer = await requireUser("/admin/setup");
  const admins = await sql<{ id: string }>(`select id from users where role = 'admin' limit 1`);
  const taken = admins.length > 0;
  return (
    <section className="narrow">
      <h1>Admin setup</h1>
      {viewer.user.role === "admin" ? <p>You are already the school admin.</p> : null}
      {viewer.user.role !== "admin" && taken ? <p>An admin has already been set up.</p> : null}
      {viewer.user.role !== "admin" && !taken ? (
        <>
          <p>Enter the setup token once. The first account it accepts becomes the school admin.</p>
          <PendingForm action={claimAdmin} submitLabel="Become admin">
            <label>
              Setup token
              <input name="token" type="password" autoComplete="off" required maxLength={200} />
            </label>
          </PendingForm>
        </>
      ) : null}
      {viewer.user.role === "admin" ? <a className="button" href="/admin">Open the catalog editor</a> : null}
    </section>
  );
}
