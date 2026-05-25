"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  name: string;
  bio: string;
  avatar: string;
  country: string;
  nativeLanguage: string;
  hourlyRate: number;
  specialties: string;
  role: "KOREAN" | "FOREIGNER";
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null); setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "저장 실패");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-4">
      <div>
        <label className="label">이름</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label">자기소개</label>
        <textarea
          className="input min-h-[100px]"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
      </div>
      <div>
        <label className="label">아바타 URL</label>
        <input className="input" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">국가</label>
          <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </div>
        {form.role === "FOREIGNER" ? (
          <div>
            <label className="label">모국어</label>
            <input className="input" value={form.nativeLanguage} onChange={(e) => setForm({ ...form, nativeLanguage: e.target.value })} />
          </div>
        ) : (
          <div>
            <label className="label">시간당 비용 (KRW)</label>
            <input
              className="input"
              type="number"
              min={5000}
              step={1000}
              value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
            />
          </div>
        )}
      </div>
      {form.role === "KOREAN" && (
        <div>
          <label className="label">전문 주제 (쉼표 구분)</label>
          <input
            className="input"
            value={form.specialties}
            onChange={(e) => setForm({ ...form, specialties: e.target.value })}
            placeholder="비즈니스, 발음, K-Pop"
          />
        </div>
      )}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {saved && <div className="text-sm text-green-600">저장되었습니다.</div>}
      <button className="btn-primary" disabled={loading}>
        {loading ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
