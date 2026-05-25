"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "FOREIGNER" as "FOREIGNER" | "KOREAN",
    bio: "",
    nativeLanguage: "",
    country: "",
    hourlyRate: 25000,
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "회원가입에 실패했습니다.");
      setLoading(false);
      return;
    }
    const signed = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (signed?.error) {
      router.push("/login");
    } else {
      router.push(form.role === "KOREAN" ? "/availability" : "/browse");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">시작하기</h1>
      <p className="text-ink-500 mb-6">한국어로 만나는 가장 자연스러운 방법.</p>
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`p-3 rounded-xl border-2 text-left ${form.role === "FOREIGNER" ? "border-brand-500 bg-brand-50" : "border-ink-300"}`}
            onClick={() => setForm((f) => ({ ...f, role: "FOREIGNER" }))}
          >
            <div className="font-semibold">🌍 외국인</div>
            <div className="text-xs text-ink-500">한국어 배우러 왔어요</div>
          </button>
          <button
            type="button"
            className={`p-3 rounded-xl border-2 text-left ${form.role === "KOREAN" ? "border-brand-500 bg-brand-50" : "border-ink-300"}`}
            onClick={() => setForm((f) => ({ ...f, role: "KOREAN" }))}
          >
            <div className="font-semibold">🇰🇷 한국인 튜터</div>
            <div className="text-xs text-ink-500">한국어를 가르치고 싶어요</div>
          </button>
        </div>

        <div>
          <label className="label">이름</label>
          <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="label">이메일</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
        </div>
        <div>
          <label className="label">비밀번호</label>
          <input className="input" type="password" minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
        </div>
        <div>
          <label className="label">자기소개</label>
          <textarea className="input min-h-[80px]" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
        </div>
        {form.role === "FOREIGNER" ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">국가</label>
              <input className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="United Kingdom" />
            </div>
            <div>
              <label className="label">모국어</label>
              <input className="input" value={form.nativeLanguage} onChange={(e) => setForm((f) => ({ ...f, nativeLanguage: e.target.value }))} placeholder="English" />
            </div>
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
              onChange={(e) => setForm((f) => ({ ...f, hourlyRate: Number(e.target.value) }))}
            />
            <p className="text-xs text-ink-500 mt-1">가입 후 가능 시간(가용성)을 설정해야 예약이 열립니다.</p>
          </div>
        )}
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "가입 중…" : "계정 만들기"}
        </button>
      </form>
      <p className="text-sm text-center mt-4 text-ink-500">
        이미 계정이 있나요? <Link href="/login" className="text-brand-600 font-medium">로그인</Link>
      </p>
    </div>
  );
}
