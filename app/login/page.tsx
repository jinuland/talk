"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callback = params.get("callbackUrl") || "/browse";
  const [email, setEmail] = useState("emma@talk.dev");
  const [password, setPassword] = useState("password123");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callback,
    });
    setLoading(false);
    if (res?.error) setErr("이메일 또는 비밀번호가 올바르지 않습니다.");
    else router.push(res?.url ?? callback);
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div>
        <label className="label">이메일</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label">비밀번호</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">로그인</h1>
      <p className="text-ink-500 mb-6">Talk 계정으로 로그인하세요.</p>
      <Suspense fallback={<div className="card p-6 text-ink-500">로딩 중…</div>}>
        <LoginForm />
      </Suspense>
      <p className="text-sm text-center mt-4 text-ink-500">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-brand-600 font-medium">
          가입하기
        </Link>
      </p>
      <div className="text-xs text-ink-500 mt-6 bg-ink-100 p-3 rounded-xl">
        <strong>데모 계정 (password123):</strong>
        <ul className="mt-1 list-disc pl-5">
          <li>외국인: emma@talk.dev, kenji@talk.dev</li>
          <li>한국인 튜터: minji@talk.dev, junho@talk.dev, sora@talk.dev, hyuk@talk.dev</li>
        </ul>
      </div>
    </div>
  );
}
