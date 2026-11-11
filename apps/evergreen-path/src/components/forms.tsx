"use client";

import { useActionState } from "react";
import { login, signup } from "@/app/actions/auth";
import { emptyState, type ActionState } from "@/lib/action-state";

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signup, emptyState);
  return (
    <form action={action} className="stack">
      {state.error ? <p className="alert" role="alert">{state.error}</p> : null}
      <input type="hidden" name="next" value={next} />
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={200} />
      </label>
      <p className="fine">At least 10 characters.</p>
      <label className="choice">
        <input name="age" type="checkbox" value="yes" required />
        <span>I confirm I am 18 or older. This school is education and enrichment for adults.</span>
      </label>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, emptyState);
  return (
    <form action={action} className="stack">
      {state.error ? <p className="alert" role="alert">{state.error}</p> : null}
      <input type="hidden" name="next" value={next} />
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
      </label>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function PendingForm({
  action,
  submitLabel,
  children,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, emptyState);
  return (
    <form action={formAction} className="stack">
      {state.error ? <p className="alert" role="alert">{state.error}</p> : null}
      {children}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Working…" : submitLabel}
      </button>
    </form>
  );
}
