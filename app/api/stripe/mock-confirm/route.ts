import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createZoomMeeting } from "@/lib/zoom";
import { generateAgenda } from "@/lib/llm";
import { durationMinutes } from "@/lib/utils";

// Mock checkout completion. Used when STRIPE_SECRET_KEY is not configured.
// Real Stripe path lives in /api/stripe/webhook.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const bookingId = url.searchParams.get("bookingId");
  const sessionId = url.searchParams.get("sessionId");
  const next = url.searchParams.get("next") || "/bookings";
  if (!bookingId) return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { host: true, guest: true, theme: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (booking.status === "PENDING_PAYMENT") {
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
        stripePaymentIntentId: sessionId ?? `mock_pi_${bookingId}`,
        zoomJoinUrl: zoom.joinUrl,
        zoomStartUrl: zoom.startUrl,
        agendaMarkdown: agenda,
      },
    });
  }
  return NextResponse.redirect(new URL(next, req.url));
}
