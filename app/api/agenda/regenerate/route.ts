import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateAgenda } from "@/lib/llm";
import { durationMinutes } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId } = (await req.json().catch(() => ({}))) as { bookingId?: string };
  if (!bookingId) return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { host: true, guest: true, theme: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.hostId !== session.user.id && booking.guestId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  await prisma.booking.update({ where: { id: bookingId }, data: { agendaMarkdown: agenda } });
  return NextResponse.json({ agendaMarkdown: agenda });
}
