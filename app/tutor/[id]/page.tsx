import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Stars } from "@/components/Stars";
import { average, formatKrw, dayLabel } from "@/lib/utils";
import { BookingPanel } from "./BookingPanel";
import { FollowButton } from "./FollowButton";
import { Globe2, MapPin, Languages } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TutorPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const tutor = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      availabilities: { orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }] },
      reviewsReceived: {
        include: { reviewer: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
      followers: { select: { followerId: true } },
      bookingsAsHost: {
        where: { status: { in: ["PENDING_PAYMENT", "CONFIRMED"] }, startTime: { gte: new Date() } },
        select: { startTime: true, endTime: true },
      },
    },
  });
  if (!tutor || tutor.role !== "KOREAN") return notFound();

  const themes = await prisma.theme.findMany({ orderBy: { title: "asc" } });
  const avg = average(tutor.reviewsReceived.map((r) => r.rating));
  const followersCount = tutor.followers.length;
  const isFollowing = session?.user
    ? tutor.followers.some((f) => f.followerId === session.user.id)
    : false;
  const isSelf = session?.user?.id === tutor.id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 flex flex-col sm:flex-row gap-5">
            <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-ink-100">
              {tutor.avatar ? (
                <Image src={tutor.avatar} alt={tutor.name} fill sizes="112px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-ink-500">
                  {tutor.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold truncate">{tutor.name}</h1>
                  <div className="flex items-center gap-3 text-sm text-ink-500 mt-1">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {tutor.country ?? "Korea"}</span>
                    <span className="flex items-center gap-1"><Globe2 size={14} /> {tutor.timezone ?? "Asia/Seoul"}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Stars value={avg} />
                    <span className="font-medium">{avg.toFixed(1)}</span>
                    <span className="text-ink-500 text-sm">· {tutor.reviewsReceived.length} 리뷰 · 팔로워 {followersCount}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-brand-600 font-bold text-xl">{formatKrw(tutor.hourlyRate ?? 0)}</div>
                  <div className="text-xs text-ink-500">/시간</div>
                </div>
              </div>
              {!isSelf && session?.user && (
                <div className="mt-3">
                  <FollowButton tutorId={tutor.id} initialFollowing={isFollowing} />
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-2">자기소개</h2>
            <p className="text-ink-700 whitespace-pre-wrap leading-7">{tutor.bio || "아직 소개가 없어요."}</p>
            {tutor.specialties && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tutor.specialties.split(",").map((s) => (
                  <span key={s.trim()} className="badge bg-brand-50 text-brand-700 border border-brand-100">
                    #{s.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-3">가능 시간 (주간)</h2>
            {tutor.availabilities.length === 0 ? (
              <p className="text-ink-500 text-sm">아직 등록된 가능 시간이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                  const slots = tutor.availabilities.filter((a) => a.dayOfWeek === dow);
                  return (
                    <div key={dow} className="space-y-1">
                      <div className="font-medium text-ink-500">{dayLabel(dow)}</div>
                      {slots.length === 0 ? (
                        <div className="text-ink-300 text-xs py-2">—</div>
                      ) : (
                        slots.map((s) => (
                          <div key={s.id} className="bg-brand-50 text-brand-700 rounded-lg py-1 px-1 text-xs">
                            {s.startHour}–{s.endHour}
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-3">리뷰 ({tutor.reviewsReceived.length})</h2>
            {tutor.reviewsReceived.length === 0 ? (
              <p className="text-ink-500 text-sm">아직 리뷰가 없어요. 첫 리뷰의 주인공이 되어 보세요.</p>
            ) : (
              <ul className="space-y-4">
                {tutor.reviewsReceived.map((r) => (
                  <li key={r.id} className="border-t border-ink-100 pt-4 first:border-0 first:pt-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-ink-100">
                        {r.reviewer.avatar ? (
                          <Image src={r.reviewer.avatar} alt={r.reviewer.name} fill sizes="32px" className="object-cover" />
                        ) : null}
                      </div>
                      <div className="font-medium text-sm">{r.reviewer.name}</div>
                      <Stars value={r.rating} size={12} />
                    </div>
                    <p className="text-sm text-ink-700">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: booking */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            {isSelf ? (
              <div className="card p-6 text-sm text-ink-500">
                본인 프로필입니다. 다른 사용자에게는 예약 패널이 보입니다.
              </div>
            ) : !session?.user ? (
              <div className="card p-6 text-sm">
                예약하려면 <a href="/login" className="text-brand-600 font-medium">로그인</a>이 필요합니다.
              </div>
            ) : session.user.role !== "FOREIGNER" ? (
              <div className="card p-6 text-sm text-ink-500">
                한국인 계정은 예약할 수 없습니다. 외국인 학습자 계정으로 로그인하세요.
              </div>
            ) : (
              <BookingPanel
                tutor={{
                  id: tutor.id,
                  name: tutor.name,
                  hourlyRate: tutor.hourlyRate ?? 25000,
                  availabilities: tutor.availabilities.map((a) => ({
                    dayOfWeek: a.dayOfWeek,
                    startHour: a.startHour,
                    endHour: a.endHour,
                  })),
                  busy: tutor.bookingsAsHost.map((b) => ({
                    start: b.startTime.toISOString(),
                    end: b.endTime.toISOString(),
                  })),
                }}
                themes={themes.map((t) => ({ id: t.id, title: t.title, emoji: t.emoji, level: t.level }))}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
