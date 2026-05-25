import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AvailabilityEditor } from "./AvailabilityEditor";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/availability");
  if (session.user.role !== "KOREAN")
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-ink-500">
        한국인 튜터 계정에서만 가능 시간을 설정할 수 있어요.
      </div>
    );

  const slots = await prisma.availability.findMany({
    where: { userId: session.user.id },
    orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">가능 시간</h1>
      <p className="text-ink-500 mt-1">학습자에게 노출될 주간 가능 시간대(시간 단위)를 설정하세요.</p>
      <div className="mt-6">
        <AvailabilityEditor
          initial={slots.map((s) => ({ id: s.id, dayOfWeek: s.dayOfWeek, startHour: s.startHour, endHour: s.endHour }))}
        />
      </div>
    </div>
  );
}
