import type { ReactNode } from "react";
import { logout } from "@/app/actions/auth";
import { brand } from "@/lib/brand";
import type { Viewer } from "@/lib/viewer";

export function Shell({ viewer, children }: { viewer: Viewer | null; children: ReactNode }) {
  return (
    <>
      <a className="skip" href="#content">Skip to content</a>
      <header className="mast">
        <a className="mark" href="/">
          <span>{brand.communityName}</span>
          <strong>{brand.schoolName}</strong>
        </a>
        <nav className="nav" aria-label="Campus">
          <a href="/pricing">Pricing</a>
          {viewer ? <a href="/catalog">Catalog</a> : null}
          {viewer ? <a href="/billing">Billing</a> : null}
          {viewer?.user.role === "admin" ? <a href="/admin">Admin</a> : null}
          {viewer ? <a href="/account">Account</a> : <a href="/login">Sign in</a>}
        </nav>
      </header>
      <main id="content" className="page">{children}</main>
      <footer className="site-footer">
        <p>
          {brand.schoolName} is education and enrichment only. Nothing here guarantees an outcome, and it is not medical, psychological, legal, or financial advice.
        </p>
        <p>If you are in distress, call or text 988 in the US. Call 911 if you are in immediate danger.</p>
        {viewer ? (
          <form action={logout}>
            <button className="button secondary" type="submit">Sign out</button>
          </form>
        ) : null}
      </footer>
    </>
  );
}
