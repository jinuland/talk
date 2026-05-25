import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { createZoomMeeting } from "@/lib/zoom";
import { generateAgenda } from "@/lib/llm";
import { durationMinutes } from "@/lib/utils";

export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return NextResponse.json({ received: true });
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { host: true, guest: true, theme: true },
    });
    if (booking && booking.status === "PENDING_PAYMENT") {
      const zoom = await createZoomMeeting({
        topic: `Talk: ${booking.host.name} × ${booking.guest.name}`,
        startTimeIso: booking.startTime.toISOString(),
        durationMinutes: durationMinutes(booking.startTime, booking.endTime),
        hostEmail: booking.host.email,
      });
      const agenda = await generateAgenda({
        hostName: booking.host.name,
        guestName: booking.guest.name,
        guestNativeLanguage: booking.guest.nativeLanguage,
        durationMinutes: durationMinutes(booking.startTime, booking.endTime),
        themeTitle: booking.theme?.title,
        themeBullets: booking.theme?.bullets,
        customTopic: booking.customTopic,
        level: booking.theme?.level,
      });
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
          stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
          zoomJoinUrl: zoom.joinUrl,
          zoomStartUrl: zoom.startUrl,
          agendaMarkdown: agenda,
        },
      });
    }
  }
  return NextResponse.json({ received: true });
}
