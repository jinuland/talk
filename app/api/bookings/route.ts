import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stripe";

const schema = z.object({
  hostId: z.string(),
  startLocal: z.string(), // "YYYY-MM-DDTHH:00:00" assumed in server local time
  durationMinutes: z.number().int().positive().max(180),
  themeId: z.string().nullable().optional(),
  customTopic: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "FOREIGNER")
    return NextResponse.json({ error: "외국인 계정만 예약할 수 있습니다." }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { hostId, startLocal, durationMinutes, themeId, customTopic } = parsed.data;

  const host = await prisma.user.findUnique({ where: { id: hostId } });
  if (!host || host.role !== "KOREAN")
    return NextResponse.json({ error: "Host not found" }, { status: 404 });

  const startTime = new Date(startLocal);
  if (Number.isNaN(startTime.getTime()))
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);

  // Conflict check against existing host bookings.
  const conflict = await prisma.booking.findFirst({
    where: {
      hostId,
      status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
  });
  if (conflict)
    return NextResponse.json({ error: "이미 예약된 시간대입니다." }, { status: 409 });

  const theme = themeId ? await prisma.theme.findUnique({ where: { id: themeId } }) : null;

  const amount = Math.round(((host.hourlyRate ?? 25000) * durationMinutes) / 60);

  const booking = await prisma.booking.create({
    data: {
      hostId,
      guestId: session.user.id,
      startTime,
      endTime,
      amount,
      status: "PENDING_PAYMENT",
      themeId: theme?.id,
      customTopic: customTopic ?? undefined,
    },
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const checkout = await createCheckoutSession({
    bookingId: booking.id,
    amountKrw: amount,
    hostName: host.name,
    themeTitle: theme?.title ?? "한국어 회화 세션",
    successUrl: `${origin}/bookings/${booking.id}?paid=1`,
    cancelUrl: `${origin}/bookings/${booking.id}?cancelled=1`,
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeSessionId: checkout.sessionId },
  });

  return NextResponse.json({ booking, checkoutUrl: checkout.url, mock: checkout.mock });
}
