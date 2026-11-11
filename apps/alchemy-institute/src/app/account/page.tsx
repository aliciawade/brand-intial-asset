import type { Metadata } from "next";
import { logout } from "@/app/actions/auth";
import { Notice } from "@/components/notice";
import { tierById } from "@/lib/brand";
import { requireUser } from "@/lib/viewer";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const viewer = await requireUser("/account");
  const tier = viewer.subscription ? tierById(viewer.subscription.tier) : null;
  return (
    <section className="narrow">
      <h1>Account</h1>
      <Notice notice={params.notice} />
      <p>{viewer.user.email}</p>
      <p>{viewer.user.role === "admin" ? "School admin" : "Learner"}</p>
      <p>{tier ? `${tier.name} · ${viewer.subscription?.status}` : "No paid plan"}</p>
      <div className="actions">
        <a className="button" href="/billing">Billing</a>
        <a className="button secondary" href="/catalog">Catalog</a>
        {viewer.user.role === "admin" ? <a className="button secondary" href="/admin">Admin</a> : <a className="button secondary" href="/admin/setup">Admin setup</a>}
      </div>
      <form action={logout}>
        <button className="button secondary" type="submit">Sign out</button>
      </form>
    </section>
  );
}
