import "server-only";
import Stripe from "stripe";
import { tierById } from "./brand";
import { brand } from "./brand";
import { databaseConfigured, sql } from "./db";

export function devEntitlementAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && !databaseConfigured();
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key) return null;
  return new Stripe(key);
}

export function subscriptionIsOpen(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing" || status === "past_due" || status === "unpaid" || status === "incomplete";
}

type PriceRow = { tier: string; interval: string; price_id: string; product_id: string };

export async function ensureStripePrices(stripe: Stripe): Promise<void> {
  for (const tier of brand.tiers) {
    const intervals: Array<"month" | "year"> = tier.monthly == null ? ["year"] : ["month", "year"];
    for (const interval of intervals) {
      const existing = await sql<{ price_id: string }>(
        `select price_id from stripe_prices where tier = $1 and interval = $2`,
        [tier.id, interval],
      );
      if (existing[0]) continue;
      const amount = interval === "month" ? tier.monthly : tier.annual;
      if (amount == null) continue;
      const product = await stripe.products.create({
        name: `${brand.schoolName} — ${tier.name}`,
        metadata: { tier: tier.id, school: brand.slug },
      });
      const price = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: amount,
        recurring: { interval },
        metadata: { tier: tier.id, school: brand.slug },
      });
      await sql(
        `insert into stripe_prices (tier, interval, price_id, product_id)
         values ($1, $2, $3, $4)
         on conflict (tier, interval) do nothing`,
        [tier.id, interval, price.id, product.id],
      );
    }
  }
}

export async function priceIdFor(tier: string, interval: "month" | "year"): Promise<string | null> {
  const rows = await sql<{ price_id: string }>(
    `select price_id from stripe_prices where tier = $1 and interval = $2`,
    [tier, interval],
  );
  return rows[0]?.price_id ?? null;
}

export async function portalConfigurationId(stripe: Stripe): Promise<string> {
  const prices = await sql<PriceRow>(
    `select tier, interval, price_id, product_id from stripe_prices order by product_id, price_id`,
  );
  const signature = prices.map((row) => row.price_id).join(",");
  const stored = await sql<{ value: string }>(`select value from app_flags where key = 'portal_config'`);
  const [savedId, savedSignature] = (stored[0]?.value ?? "").split("|");
  if (savedId && savedSignature === signature) return savedId;

  const byProduct = new Map<string, string[]>();
  for (const row of prices) {
    const list = byProduct.get(row.product_id) ?? [];
    list.push(row.price_id);
    byProduct.set(row.product_id, list);
  }

  const configuration = await stripe.billingPortal.configurations.create({
    business_profile: { headline: brand.schoolName },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: [...byProduct.entries()].map(([product, productPrices]) => ({
          product,
          prices: productPrices,
        })),
      },
    },
  });

  await sql(
    `insert into app_flags (key, value) values ('portal_config', $1)
     on conflict (key) do update set value = excluded.value`,
    [`${configuration.id}|${signature}`],
  );
  return configuration.id;
}

function periodEndUnix(subscription: Stripe.Subscription): number | null {
  const legacy = subscription as Stripe.Subscription & { current_period_end?: number };
  if (typeof legacy.current_period_end === "number") return legacy.current_period_end;
  const item = subscription.items?.data?.[0] as { current_period_end?: number } | undefined;
  return typeof item?.current_period_end === "number" ? item.current_period_end : null;
}

async function tierForPrice(priceId: string | null | undefined): Promise<string | null> {
  if (!priceId) return null;
  const rows = await sql<{ tier: string }>(`select tier from stripe_prices where price_id = $1`, [priceId]);
  return rows[0]?.tier ?? null;
}

async function userIdForCustomer(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  const rows = await sql<{ id: string }>(`select id from users where stripe_customer_id = $1`, [customerId]);
  return rows[0]?.id ?? null;
}

export async function upsertSubscription(input: {
  userId: string;
  tier: string;
  status: string;
  customerId: string | null;
  subscriptionId: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}): Promise<void> {
  if (!tierById(input.tier)) return;
  if (input.customerId) {
    await sql(`update users set stripe_customer_id = $2 where id = $1`, [input.userId, input.customerId]);
  }
  await sql(
    `insert into subscriptions (
       user_id, tier, status, stripe_customer_id, stripe_subscription_id,
       current_period_end, cancel_at_period_end, updated_at
     ) values ($1, $2, $3, $4, $5, $6, $7, now())
     on conflict (user_id) do update set
       tier = excluded.tier,
       status = excluded.status,
       stripe_customer_id = coalesce(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
       stripe_subscription_id = excluded.stripe_subscription_id,
       current_period_end = excluded.current_period_end,
       cancel_at_period_end = excluded.cancel_at_period_end,
       updated_at = now()`,
    [
      input.userId,
      input.tier,
      input.status,
      input.customerId,
      input.subscriptionId,
      input.periodEnd,
      input.cancelAtPeriodEnd,
    ],
  );
}

export async function applySubscription(subscription: Stripe.Subscription): Promise<void> {
  const rawPrice = subscription.items?.data?.[0]?.price;
  const priceId = typeof rawPrice === "string" ? rawPrice : rawPrice?.id ?? null;
  const tier = (await tierForPrice(priceId)) ?? subscription.metadata?.tier ?? null;
  if (!tier || !tierById(tier)) return;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;
  const userId = subscription.metadata?.user_id || (await userIdForCustomer(customerId));
  if (!userId) return;
  const unix = periodEndUnix(subscription);
  await upsertSubscription({
    userId,
    tier,
    status: subscription.status,
    customerId,
    subscriptionId: subscription.id,
    periodEnd: unix ? new Date(unix * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });
}

export async function claimEvent(id: string): Promise<boolean> {
  const rows = await sql<{ id: string }>(
    `insert into stripe_events (id) values ($1) on conflict do nothing returning id`,
    [id],
  );
  return Boolean(rows[0]);
}

export async function releaseEvent(id: string): Promise<void> {
  await sql(`delete from stripe_events where id = $1`, [id]);
}

export async function applyStripeEvent(event: Stripe.Event): Promise<void> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id ?? null;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    if (userId && customerId) {
      await sql(`update users set stripe_customer_id = $2 where id = $1`, [userId, customerId]);
    }
    if (typeof session.subscription === "string") {
      const stripe = getStripe();
      if (!stripe) return;
      if (userId) {
        await stripe.subscriptions.update(session.subscription, {
          metadata: { user_id: userId, tier: session.metadata?.tier ?? "" },
        });
      }
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await applySubscription(subscription);
    }
    return;
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await applySubscription(event.data.object as Stripe.Subscription);
  }
}

export async function confirmCheckoutSession(userId: string, sessionId: string): Promise<void> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return;
  const stripe = getStripe();
  if (!stripe) return;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.user_id !== userId) return;
  if (session.mode !== "subscription" || session.status !== "complete") return;
  const customerId = typeof session.customer === "string" ? session.customer : null;
  if (customerId) {
    await sql(`update users set stripe_customer_id = $2 where id = $1`, [userId, customerId]);
  }
  if (typeof session.subscription === "string") {
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    await applySubscription(subscription);
  }
}

export async function grantDevEntitlement(userId: string): Promise<void> {
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await upsertSubscription({
    userId,
    tier: "member",
    status: "active",
    customerId: null,
    subscriptionId: null,
    periodEnd,
    cancelAtPeriodEnd: false,
  });
}
