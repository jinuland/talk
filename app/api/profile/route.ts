import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1),
  bio: z.string().max(2000).optional().default(""),
  avatar: z.string().url().or(z.literal("")).optional(),
  country: z.string().optional().default(""),
  nativeLanguage: z.string().optional().default(""),
  hourlyRate: z.number().int().min(1000).max(10_000_000).optional(),
  specialties: z.string().optional().default(""),
  role: z.enum(["KOREAN", "FOREIGNER"]),
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: d.name,
      bio: d.bio || null,
      avatar: d.avatar || null,
      country: d.country || null,
      nativeLanguage: d.nativeLanguage || null,
      specialties: d.role === "KOREAN" ? d.specialties || null : null,
      hourlyRate: d.role === "KOREAN" ? d.hourlyRate ?? null : null,
    },
  });
  return NextResponse.json({ ok: true });
}
