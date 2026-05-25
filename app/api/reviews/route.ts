import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { bookingId, rating, comment } = parsed.data;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.guestId !== session.user.id)
    return NextResponse.json({ error: "Only the guest can review" }, { status: 403 });
  if (booking.status !== "COMPLETED" && booking.endTime > new Date())
    return NextResponse.json({ error: "세션이 끝난 후에만 리뷰할 수 있어요." }, { status: 400 });

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) return NextResponse.json({ error: "이미 리뷰를 남겼습니다." }, { status: 409 });

  const review = await prisma.review.create({
    data: {
      bookingId,
      reviewerId: session.user.id,
      revieweeId: booking.hostId,
      rating,
      comment,
    },
  });
  if (booking.status !== "COMPLETED") {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });
  }
  return NextResponse.json({ review });
}
