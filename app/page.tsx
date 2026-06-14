import Link from "next/link";
import { prisma } from "@/lib/db";
import { TutorCard, TutorCardData } from "@/components/TutorCard";
import { average } from "@/lib/utils";
import { ArrowRight, Sparkles, ShieldCheck, Video, CalendarCheck2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function getFeaturedTutors(): Promise<TutorCardData[]> {
  const tutors = await prisma.user.findMany({
    where: { role: "KOREAN" },
    include: {
      reviewsReceived: { select: { rating: true } },
      followers: { select: { id: true } },
    },
    take: 4,
  });
  return tutors.map((t) => ({
    id: t.id,
    name: t.name,
    avatar: t.avatar,
    bio: t.bio,
    hourlyRate: t.hourlyRate,
    specialties: t.specialties,
    averageRating: average(t.reviewsReceived.map((r) => r.rating)),
    reviewCount: t.reviewsReceived.length,
    followers: t.followers.length,
  }));
}

export default async function HomePage() {
  const featured = await getFeaturedTutors();
  return (
    <div>
      {/* Hero */}
      <section className="px-4 pt-16 pb-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="badge bg-brand-50 text-brand-700 mb-4">
              <Sparkles size={12} /> AI 아젠다 + 1:1 Zoom
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              검증된 한국인과<br />
              <span className="text-brand-500">진짜 한국어</span>로 대화하세요.
            </h1>
            <p className="text-lg text-ink-700 mt-4">
              팔로우한 한국인 친구의 가능 시간에 예약하고, AI가 만든 맞춤형 아젠다로
              어색함 없이 시작하세요. 결제는 Stripe, 미팅은 Zoom 으로 자동 생성됩니다.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/browse" className="btn-primary text-base">
                튜터 찾기 <ArrowRight size={18} />
              </Link>
              <Link href="/signup" className="btn-outline text-base">시작하기</Link>
            </div>
            <p className="text-xs text-ink-500 mt-3">
              데모 계정: <code className="bg-ink-100 px-1 rounded">emma@talk.dev</code> / <code className="bg-ink-100 px-1 rounded">password123</code>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Feature icon={<CalendarCheck2 />} title="달력 예약" desc="튜터의 가능 시간 한 눈에." />
            <Feature icon={<Sparkles />} title="AI 아젠다" desc="테마 선택 → 자동 생성." />
            <Feature icon={<Video />} title="자동 Zoom" desc="결제 즉시 미팅 링크." />
            <Feature icon={<ShieldCheck />} title="별점 & 리뷰" desc="검증된 호스트만." />
          </div>
        </div>
      </section>

      {/* Featured tutors */}
      <section className="px-4 pb-20 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold">인기 한국인 튜터</h2>
          <Link href="/browse" className="text-brand-600 text-sm flex items-center gap-1">
            전체 보기 <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((t) => (
            <TutorCard key={t.id} tutor={t} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card p-4">
      <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
        {icon}
      </div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-ink-500">{desc}</div>
    </div>
  );
}
