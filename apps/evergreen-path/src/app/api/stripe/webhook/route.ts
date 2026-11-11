import { NextResponse } from "next/server";
import { applyStripeEvent, claimEvent, getStripe, releaseEvent } from "@/lib/billing";
import { safeLog } from "@/lib/text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 500 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }
  const payload = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error(safeLog(error));
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const claimed = await claimEvent(event.id);
  if (!claimed) return NextResponse.json({ received: true, duplicate: true });

  try {
    await applyStripeEvent(event);
  } catch (error) {
    await releaseEvent(event.id);
    console.error(safeLog(error));
    return NextResponse.json({ error: "Event could not be applied." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
