import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatKrw, fmtDateTime } from "@/lib/utils";
import { CalendarDays, Video, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/bookings");
  const isHost = session.user.role === "KOREAN";

  const bookings = await prisma.booking.findMany({
    where: isHost ? { hostId: session.user.id } : { guestId: session.user.id },
    include: { host: true, guest: true, theme: true, review: true },
    orderBy: { startTime: "desc" },
  });

  const upcoming = bookings.filter((b) => b.endTime >= new Date());
  const past = bookings.filter((b) => b.endTime < new Date());

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">내 예약</h1>

      <Section title={`다가오는 세션 (${upcoming.length})`} items={upcoming} viewerIsHost={isHost} viewerId={session.user.id} />
      <div className="mt-10" />
      <Section title={`지난 세션 (${past.length})`} items={past} viewerIsHost={isHost} viewerId={session.user.id} />
    </div>
  );
}

type BookingWithRel = Awaited<ReturnType<typeof prisma.booking.findMany>>[number] & {
  host: { name: string; avatar: string | null };
  guest: { name: string; avatar: string | null };
  theme: { title: string; emoji: string | null } | null;
  review: { id: string } | null;
};

function Section({
  title,
  items,
  viewerIsHost,
  viewerId,
}: {
  title: string;
  items: BookingWithRel[];
  viewerIsHost: boolean;
  viewerId: string;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {items.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">
          예약이 없습니다.{" "}
          {!viewerIsHost && (
            <Link href="/browse" className="text-brand-600 font-medium">
              튜터 찾기 →
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => {
            const other = viewerIsHost ? b.guest : b.host;
            return (
              <li key={b.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm text-ink-500">
                    <CalendarDays size={14} /> {fmtDateTime(b.startTime)} – {fmtDateTime(b.endTime).slice(11)}
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="font-medium mt-1">
                    {viewerIsHost ? "Guest" : "Host"}: {other.name}
                    {b.theme && (
                      <span className="ml-2 text-ink-500 text-sm">
                        · {b.theme.emoji ?? ""} {b.theme.title}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-ink-500">{formatKrw(b.amount)}</span>
                  {b.status === "CONFIRMED" && b.zoomJoinUrl && (
                    <a
                      href={viewerIsHost && b.zoomStartUrl ? b.zoomStartUrl : b.zoomJoinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost text-sm"
                    >
                      <Video size={14} /> Zoom
                    </a>
                  )}
                  <Link href={`/bookings/${b.id}`} className="btn-primary text-sm">
                    <Sparkles size={14} /> 상세
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    COMPLETED: "bg-ink-100 text-ink-700",
    CANCELLED: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = {
    PENDING_PAYMENT: "결제 대기",
    CONFIRMED: "확정",
    COMPLETED: "완료",
    CANCELLED: "취소됨",
  };
  return <span className={`badge ${map[status] ?? "bg-ink-100"}`}>{labels[status] ?? status}</span>;
}
