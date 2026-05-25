import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  tutorId: z.string(),
  action: z.enum(["follow", "unfollow"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { tutorId, action } = parsed.data;
  if (tutorId === session.user.id)
    return NextResponse.json({ error: "본인은 팔로우할 수 없습니다." }, { status: 400 });

  if (action === "follow") {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: session.user.id, followingId: tutorId } },
      create: { followerId: session.user.id, followingId: tutorId },
      update: {},
    });
  } else {
    await prisma.follow
      .delete({
        where: { followerId_followingId: { followerId: session.user.id, followingId: tutorId } },
      })
      .catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
