"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { clientAddress, enforceLimit } from "@/lib/http";
import { ensureSeed } from "@/lib/seed";
import { createSession, clearSession } from "@/lib/session";
import { authenticate, registerUser } from "@/lib/users";
import { safeNextPath } from "@/lib/viewer";

export async function signup(_state: ActionState, formData: FormData): Promise<ActionState> {
  await ensureSeed();
  const limited = await enforceLimit(`signup:${await clientAddress()}`, 5, 60 * 60 * 1000);
  if (limited) return { error: limited };
  const result = await registerUser({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    ageConfirmed: formData.get("age") === "yes",
  });
  if (!result.ok) return { error: result.error };
  await createSession(result.userId);
  redirect(safeNextPath(formData.get("next")));
}

export async function login(_state: ActionState, formData: FormData): Promise<ActionState> {
  await ensureSeed();
  const limited = await enforceLimit(`login:${await clientAddress()}`, 10, 15 * 60 * 1000);
  if (limited) return { error: limited };
  const result = await authenticate(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  if (!result.ok) return { error: result.error };
  await createSession(result.userId);
  redirect(safeNextPath(formData.get("next")));
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/");
}
