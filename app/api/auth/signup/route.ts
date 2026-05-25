import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["KOREAN", "FOREIGNER"]),
  bio: z.string().optional(),
  nativeLanguage: z.string().optional(),
  country: z.string().optional(),
  hourlyRate: z.number().int().min(1000).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (exists) return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      password: hashed,
      name: data.name,
      role: data.role,
      bio: data.bio,
      nativeLanguage: data.nativeLanguage,
      country: data.country,
      hourlyRate: data.role === "KOREAN" ? data.hourlyRate ?? 25000 : null,
      avatar: `https://i.pravatar.cc/300?u=${encodeURIComponent(data.email)}`,
    },
    select: { id: true, email: true, role: true },
  });
  return NextResponse.json({ user });
}
