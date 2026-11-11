import "server-only";
import { redirect } from "next/navigation";
import { canAccessCourse } from "./access";
import { asBoolean } from "./text";
import { sql } from "./db";
import { ensureSeed } from "./seed";
import { sessionTokenHash } from "./session";

export type Viewer = {
  user: {
    id: string;
    email: string;
    role: "learner" | "admin";
    stripeCustomerId: string | null;
  };
  subscription: {
    tier: string;
    status: string;
    periodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  } | null;
};

type ViewerRow = {
  id: string;
  email: string;
  role: string;
  stripe_customer_id: string | null;
  tier: string | null;
  status: string | null;
  current_period_end: string | Date | null;
  cancel_at_period_end: boolean | null;
  sub_customer_id: string | null;
  stripe_subscription_id: string | null;
};

export async function getViewer(): Promise<Viewer | null> {
  await ensureSeed();
  const tokenHash = await sessionTokenHash();
  if (!tokenHash) return null;
  const rows = await sql<ViewerRow>(
    `select u.id, u.email, u.role, u.stripe_customer_id,
            s.tier, s.status, s.current_period_end, s.cancel_at_period_end,
            s.stripe_customer_id as sub_customer_id, s.stripe_subscription_id
     from sessions sess
     join users u on u.id = sess.user_id
     left join subscriptions s on s.user_id = u.id
     where sess.token_hash = $1 and sess.expires_at > now()`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return null;
  const periodEnd = row.current_period_end ? new Date(row.current_period_end).toISOString() : null;
  return {
    user: {
      id: row.id,
      email: row.email,
      role: row.role === "admin" ? "admin" : "learner",
      stripeCustomerId: row.stripe_customer_id,
    },
    subscription: row.tier && row.status
      ? {
          tier: row.tier,
          status: row.status,
          periodEnd,
          cancelAtPeriodEnd: asBoolean(row.cancel_at_period_end),
          stripeCustomerId: row.sub_customer_id,
          stripeSubscriptionId: row.stripe_subscription_id,
        }
      : null,
  };
}

export async function requireUser(nextPath: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireUser("/admin");
  if (viewer.user.role !== "admin") redirect("/account?notice=admins-only");
  return viewer;
}

export function viewerCanAccess(viewer: Viewer, minTier: string): boolean {
  return canAccessCourse({
    role: viewer.user.role,
    status: viewer.subscription?.status ?? null,
    tier: viewer.subscription?.tier ?? null,
    periodEnd: viewer.subscription?.periodEnd ?? null,
    minTier,
  });
}

export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return "/catalog";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/catalog";
  if (value.length > 200) return "/catalog";
  return value;
}
