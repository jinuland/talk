import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  slots: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startHour: z.number().int().min(0).max(23),
        endHour: z.number().int().min(1).max(24),
      })
    )
    .max(100),
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "KOREAN")
    return NextResponse.json({ error: "Korean hosts only" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const valid = parsed.data.slots.filter((s) => s.endHour > s.startHour);

  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { userId: session.user.id } }),
    ...valid.map((s) =>
      prisma.availability.create({
        data: {
          userId: session.user.id,
          dayOfWeek: s.dayOfWeek,
          startHour: s.startHour,
          endHour: s.endHour,
        },
      })
    ),
  ]);
  return NextResponse.json({ ok: true });
}
