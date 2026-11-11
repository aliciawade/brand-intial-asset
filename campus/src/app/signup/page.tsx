import type { Metadata } from "next";
import { SignupForm } from "@/components/forms";
import { safeNextPath } from "@/lib/viewer";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  return (
    <section className="narrow">
      <h1>Create an account</h1>
      <p>An account lets you subscribe. Lessons stay closed until a paid plan is active.</p>
      <SignupForm next={next} />
      <p>Already enrolled? <a href={`/login?next=${encodeURIComponent(next)}`}>Sign in</a></p>
    </section>
  );
}
