import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AgendaView } from "@/components/AgendaView";
import { formatKrw, fmtDateTime, durationMinutes } from "@/lib/utils";
import { Video, Sparkles } from "lucide-react";
import { RegenerateAgendaButton } from "./RegenerateAgendaButton";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { paid?: string; cancelled?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/bookings/${params.id}`);

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { host: true, guest: true, theme: true, review: true },
  });
  if (!booking) return notFound();
  if (booking.hostId !== session.user.id && booking.guestId !== session.user.id)
    return notFound();

  const isHost = booking.hostId === session.user.id;
  const counterpart = isHost ? booking.guest : booking.host;
  const dur = durationMinutes(booking.startTime, booking.endTime);
  const isPast = booking.endTime < new Date();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      {searchParams.paid && booking.status === "CONFIRMED" && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm">
          ✅ 결제가 완료되었습니다! Zoom 링크와 AI 아젠다가 아래에 생성되었어요.
        </div>
      )}
      {searchParams.cancelled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 text-sm">
          결제가 취소되었습니다. 다시 시도해 주세요.
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{isHost ? "Guest" : "Host"}: {counterpart.name}</h1>
            <div className="text-ink-500 text-sm mt-1">
              {fmtDateTime(booking.startTime)} – {fmtDateTime(booking.endTime).slice(11)} · {dur}분
            </div>
            {booking.theme && (
              <div className="text-sm mt-2">
                테마: <span className="font-medium">{booking.theme.emoji ?? ""} {booking.theme.title}</span>
              </div>
            )}
            {booking.customTopic && (
              <div className="text-sm text-ink-700 mt-1">요청: {booking.customTopic}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-ink-500">결제 금액</div>
            <div className="text-xl font-bold text-brand-600">{formatKrw(booking.amount)}</div>
          </div>
        </div>

        {booking.status === "CONFIRMED" && booking.zoomJoinUrl && (
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={isHost && booking.zoomStartUrl ? booking.zoomStartUrl : booking.zoomJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Video size={16} /> Zoom 참여
            </a>
            <a
              href={booking.zoomJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-sm"
            >
              참여 링크 복사용
            </a>
          </div>
        )}

        {booking.status === "PENDING_PAYMENT" && (
          <div className="mt-5 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-xl p-4 text-sm">
            아직 결제가 완료되지 않았습니다.
          </div>
        )}
      </div>

      {booking.agendaMarkdown && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles size={16} className="text-brand-500" /> AI 아젠다
            </h2>
            <RegenerateAgendaButton bookingId={booking.id} />
          </div>
          <AgendaView markdown={booking.agendaMarkdown} />
        </div>
      )}

      {/* Review section: only foreigner guest, only after session, only once */}
      {!isHost && isPast && !booking.review && (
        <div className="card p-6">
          <h2 className="font-semibold mb-3">호스트 리뷰 남기기</h2>
          <ReviewForm bookingId={booking.id} />
        </div>
      )}
      {booking.review && (
        <div className="card p-6">
          <h2 className="font-semibold mb-2">제출된 리뷰</h2>
          <p className="text-ink-700">{booking.review ? "리뷰가 등록되었습니다. 감사합니다!" : null}</p>
        </div>
      )}
    </div>
  );
}
