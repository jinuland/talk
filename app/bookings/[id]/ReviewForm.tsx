"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, rating, comment }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "리뷰 등록 실패");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            className="p-1"
            aria-label={`${n} stars`}
          >
            <Star size={28} className={n <= rating ? "text-brand-500 fill-current" : "text-ink-300"} />
          </button>
        ))}
        <span className="ml-2 text-sm text-ink-500">{rating}/5</span>
      </div>
      <textarea
        className="input min-h-[100px]"
        placeholder="세션은 어떠셨나요?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {err && <div className="text-sm text-red-600">{err}</div>}
      <button className="btn-primary" disabled={loading}>
        {loading ? "제출 중…" : "리뷰 제출"}
      </button>
    </form>
  );
}
