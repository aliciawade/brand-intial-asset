export const NOTICES: Record<string, string> = {
  "stripe-off": "Checkout is not open yet. Payment setup is still being connected.",
  "checkout-failed": "Checkout could not be started. Try again in a moment.",
  "portal-failed": "The billing portal could not be opened. Try again in a moment.",
  "portal-missing": "Subscribe before opening the billing portal.",
  success: "If Stripe confirmed the payment, your plan is active now.",
  cancel: "Checkout was canceled. This visit did not start a charge.",
  preview: "This machine is previewing Member Circle access. It is not a paid subscription.",
  "preview-closed": "Preview access is not available on this campus.",
  limited: "Too many attempts. Wait a little while and try again.",
  "already-subscribed": "You already have a subscription. Use the billing portal to change or cancel it.",
  "admins-only": "That page is for the school admin.",
  saved: "Saved.",
};

export function noticeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return NOTICES[value] ?? null;
}
