import { prisma } from "@/lib/db";
import { TutorCard, TutorCardData } from "@/components/TutorCard";
import { average } from "@/lib/utils";
import { SearchInput } from "./SearchInput";

export const dynamic = "force-dynamic";

async function getTutors(q?: string): Promise<TutorCardData[]> {
  const where = q
    ? {
        role: "KOREAN",
        OR: [
          { name: { contains: q } },
          { bio: { contains: q } },
          { specialties: { contains: q } },
        ],
      }
    : { role: "KOREAN" };
  const tutors = await prisma.user.findMany({
    where: where as { role: string },
    include: {
      reviewsReceived: { select: { rating: true } },
      followers: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
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

export default async function BrowsePage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const tutors = await getTutors(q || undefined);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">한국인 튜터 찾기</h1>
          <p className="text-ink-500 mt-1">이름, 자기소개, 전문 주제로 검색하세요.</p>
        </div>
        <SearchInput initial={q} />
      </div>

      {tutors.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">
          검색 결과가 없습니다. 다른 키워드로 다시 시도해 보세요.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutors.map((t) => (
            <TutorCard key={t.id} tutor={t} />
          ))}
        </div>
      )}
    </div>
  );
}
