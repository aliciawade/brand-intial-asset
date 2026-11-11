import type { Metadata } from "next";
import { LoginForm } from "@/components/forms";
import { safeNextPath } from "@/lib/viewer";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  return (
    <section className="narrow">
      <h1>Sign in</h1>
      <LoginForm next={next} />
      <p>New here? <a href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</a></p>
    </section>
  );
}
