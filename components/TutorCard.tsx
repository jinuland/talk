import Link from "next/link";
import Image from "next/image";
import { Stars } from "./Stars";
import { formatKrw } from "@/lib/utils";

export type TutorCardData = {
  id: string;
  name: string;
  avatar?: string | null;
  bio?: string | null;
  hourlyRate?: number | null;
  specialties?: string | null;
  averageRating: number;
  reviewCount: number;
  followers: number;
};

export function TutorCard({ tutor }: { tutor: TutorCardData }) {
  const tags = (tutor.specialties ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <Link
      href={`/tutor/${tutor.id}`}
      className="card p-4 hover:shadow-soft transition-shadow flex flex-col gap-3 group"
    >
      <div className="flex items-start gap-3">
        <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden bg-ink-100">
          {tutor.avatar ? (
            <Image src={tutor.avatar} alt={tutor.name} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-ink-500">
              {tutor.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate group-hover:text-brand-600">{tutor.name}</div>
          <div className="text-sm text-ink-500 flex items-center gap-2">
            <Stars value={tutor.averageRating} />
            <span>
              {tutor.averageRating.toFixed(1)}
              <span className="text-ink-500"> · {tutor.reviewCount} 리뷰</span>
            </span>
          </div>
          <div className="text-xs text-ink-500 mt-0.5">팔로워 {tutor.followers}명</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-brand-600 font-bold">{formatKrw(tutor.hourlyRate ?? 0)}</div>
          <div className="text-[11px] text-ink-500">/시간</div>
        </div>
      </div>
      <p className="text-sm text-ink-700 line-clamp-2">{tutor.bio || "자기소개가 아직 없어요."}</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <span key={t} className="badge bg-brand-50 text-brand-700 border border-brand-100">
              #{t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
