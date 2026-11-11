"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import {
  devEntitlementAllowed,
  ensureStripePrices,
  getStripe,
  grantDevEntitlement,
  portalConfigurationId,
  priceIdFor,
  subscriptionIsOpen,
} from "@/lib/billing";
import { tierById } from "@/lib/brand";
import { enforceLimit, requestOrigin } from "@/lib/http";
import { readInterval, readTier, safeLog } from "@/lib/text";
import { requireUser } from "@/lib/viewer";

export async function startCheckout(formData: FormData): Promise<void> {
  const viewer = await requireUser("/billing");
  const limited = await enforceLimit(`checkout:${viewer.user.id}`, 8, 60 * 60 * 1000);
  if (limited) redirect("/billing?notice=limited");
  const tier = readTier(formData.get("tier"));
  const interval = readInterval(formData.get("interval"));
  const tierInfo = tier ? tierById(tier) : null;
  if (!tier || !interval || !tierInfo || (interval === "month" && tierInfo.monthly == null)) {
    redirect("/billing?notice=checkout-failed");
  }
  if (subscriptionIsOpen(viewer.subscription?.status)) redirect("/billing?notice=already-subscribed");
  const stripe = getStripe();
  if (!stripe) redirect("/billing?notice=stripe-off");

  let destination = "";
  try {
    await ensureStripePrices(stripe);
    const price = await priceIdFor(tier, interval);
    if (!price) redirect("/billing?notice=checkout-failed");
    const origin = await requestOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: viewer.user.stripeCustomerId ?? undefined,
      customer_email: viewer.user.stripeCustomerId ? undefined : viewer.user.email,
      client_reference_id: viewer.user.id,
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/billing?notice=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?notice=cancel`,
      metadata: { user_id: viewer.user.id, tier },
      subscription_data: { metadata: { user_id: viewer.user.id, tier } },
    });
    destination = session.url ?? "";
  } catch (error) {
    unstable_rethrow(error);
    console.error(safeLog(error));
    redirect("/billing?notice=checkout-failed");
  }
  if (!destination) redirect("/billing?notice=checkout-failed");
  redirect(destination);
}

export async function openPortal(): Promise<void> {
  const viewer = await requireUser("/billing");
  const limited = await enforceLimit(`portal:${viewer.user.id}`, 8, 60 * 60 * 1000);
  if (limited) redirect("/billing?notice=limited");
  const stripe = getStripe();
  if (!stripe) redirect("/billing?notice=stripe-off");
  const customer = viewer.user.stripeCustomerId ?? viewer.subscription?.stripeCustomerId ?? null;
  if (!customer) redirect("/billing?notice=portal-missing");

  let destination = "";
  try {
    await ensureStripePrices(stripe);
    const configuration = await portalConfigurationId(stripe);
    const origin = await requestOrigin();
    const session = await stripe.billingPortal.sessions.create({
      customer,
      configuration,
      return_url: `${origin}/billing`,
    });
    destination = session.url;
  } catch (error) {
    unstable_rethrow(error);
    console.error(safeLog(error));
    redirect("/billing?notice=portal-failed");
  }
  if (!destination) redirect("/billing?notice=portal-failed");
  redirect(destination);
}

export async function grantPreview(): Promise<void> {
  const viewer = await requireUser("/billing");
  if (!devEntitlementAllowed()) redirect("/billing?notice=preview-closed");
  await grantDevEntitlement(viewer.user.id);
  redirect("/catalog?notice=preview");
}
