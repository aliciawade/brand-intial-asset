import type { Metadata } from "next";
import { grantPreview, openPortal, startCheckout } from "@/app/actions/billing";
import { Notice } from "@/components/notice";
import { tierById } from "@/lib/brand";
import { brand } from "@/lib/brand";
import { confirmCheckoutSession, devEntitlementAllowed, stripeConfigured, subscriptionIsOpen } from "@/lib/billing";
import { formatDate, formatMoney } from "@/lib/format";
import { safeLog } from "@/lib/text";
import { getViewer, requireUser, viewerCanAccess } from "@/lib/viewer";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const viewer = await requireUser("/billing");
  if (params.session_id) {
    try {
      await confirmCheckoutSession(viewer.user.id, params.session_id);
    } catch (error) {
      console.error(safeLog(error));
    }
  }
  const current = params.session_id ? (await getViewer()) ?? viewer : viewer;
  const subscription = current.subscription;
  const tier = subscription ? tierById(subscription.tier) : null;
  const open = subscriptionIsOpen(subscription?.status);
  const entitled = viewerCanAccess(current, "welcome") || current.user.role === "admin";
  const payments = stripeConfigured();

  return (
    <section className="stack">
      <div className="section-head">
        <h1>Billing</h1>
        <p>{planSentence(current.user.role, subscription, tier?.name ?? null)}</p>
        <p>{entitled ? "Lessons are open for your level." : "Lessons stay closed until a paid plan is active."}</p>
      </div>
      <Notice notice={params.notice} />
      {open && payments ? (
        <form action={openPortal}>
          <button className="button" type="submit">Change or cancel in the billing portal</button>
        </form>
      ) : null}
      {!open && !payments ? (
        <p className="notice">Checkout is not open yet. Payment setup is still being connected. Lessons stay closed until a subscription is active.</p>
      ) : null}
      {!open && payments ? (
        <div className="tier-grid">
          {brand.tiers.map((level) => (
            <article className="tier" key={level.id}>
              <h2>{level.name}</h2>
              <p>{level.blurb}</p>
              {level.note ? <p className="fine">{level.note}</p> : null}
              <div className="stack">
                {level.monthly != null ? (
                  <form action={startCheckout}>
                    <input type="hidden" name="tier" value={level.id} />
                    <input type="hidden" name="interval" value="month" />
                    <button className="button" type="submit">{formatMoney(level.monthly)} / month</button>
                  </form>
                ) : null}
                <form action={startCheckout}>
                  <input type="hidden" name="tier" value={level.id} />
                  <input type="hidden" name="interval" value="year" />
                  <button className="button secondary" type="submit">{formatMoney(level.annual)} / year</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      {devEntitlementAllowed() ? (
        <form action={grantPreview} className="panel stack">
          <h2>Local preview</h2>
          <p>This machine has no campus database, so you can preview Member Circle lessons here. The published school does not offer this, and it is not a paid subscription.</p>
          <button className="button secondary" type="submit">Preview Member Circle</button>
        </form>
      ) : null}
    </section>
  );
}

function planSentence(
  role: "learner" | "admin",
  subscription: { tier: string; status: string; periodEnd: string | null; cancelAtPeriodEnd: boolean } | null,
  tierName: string | null,
): string {
  if (role === "admin" && !subscription) return "You are the school admin. Editing the catalog does not require a subscription.";
  if (!subscription || !tierName) return "You do not have a paid plan yet.";
  if (subscription.status === "active" && subscription.cancelAtPeriodEnd) {
    return `${tierName} is active through ${formatDate(subscription.periodEnd)}, then it ends.`;
  }
  if (subscription.status === "active" || subscription.status === "trialing") {
    return subscription.periodEnd ? `${tierName} is active through ${formatDate(subscription.periodEnd)}.` : `${tierName} is active.`;
  }
  if (subscription.status === "past_due" || subscription.status === "unpaid") {
    return `${tierName} needs a current payment before lessons open.`;
  }
  if (subscription.status === "canceled") return `${tierName} is canceled.`;
  return `${tierName} is ${subscription.status}.`;
}
