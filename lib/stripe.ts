import Stripe from "stripe";

export const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;

export const stripe = stripeEnabled
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia" as Stripe.StripeConfig["apiVersion"],
    })
  : null;

export type CheckoutInput = {
  bookingId: string;
  amountKrw: number;
  hostName: string;
  themeTitle: string;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutResult = {
  url: string;
  sessionId: string;
  mock: boolean;
};

export async function createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
  if (!stripe) {
    // Mock path: pretend Stripe redirects and our /api/stripe/mock-confirm flips it.
    const sessionId = `mock_${input.bookingId}_${Date.now()}`;
    const url = `/api/stripe/mock-confirm?bookingId=${encodeURIComponent(input.bookingId)}&sessionId=${encodeURIComponent(sessionId)}&next=${encodeURIComponent(input.successUrl)}`;
    return { url, sessionId, mock: true };
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "krw",
          unit_amount: input.amountKrw,
          product_data: {
            name: `한국어 회화 세션 with ${input.hostName}`,
            description: input.themeTitle,
          },
        },
      },
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { bookingId: input.bookingId },
  });
  return { url: session.url!, sessionId: session.id, mock: false };
}
