"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Search, CalendarDays, User as UserIcon, LogOut, MessageCircle } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const isHost = user?.role === "KOREAN";

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-ink-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-500 text-white">
            <MessageCircle size={18} />
          </span>
          <span>Talk</span>
          <span className="text-xs font-normal text-ink-500 ml-1 hidden sm:inline">한국어 회화 마켓</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3 text-sm">
          <Link href="/browse" className="px-3 py-2 rounded-lg hover:bg-ink-100 flex items-center gap-1.5">
            <Search size={16} /> 튜터 찾기
          </Link>
          {user && (
            <Link href="/bookings" className="px-3 py-2 rounded-lg hover:bg-ink-100 flex items-center gap-1.5">
              <CalendarDays size={16} /> 내 예약
            </Link>
          )}
          {user && isHost && (
            <Link href="/availability" className="px-3 py-2 rounded-lg hover:bg-ink-100 hidden sm:flex items-center gap-1.5">
              가능 시간
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-ink-100">
              <Link href="/profile" className="px-3 py-2 rounded-lg hover:bg-ink-100 flex items-center gap-1.5">
                <UserIcon size={16} /> <span className="hidden sm:inline">{user.name}</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-2 py-2 rounded-lg hover:bg-ink-100 text-ink-500"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link href="/login" className="btn-ghost text-sm">로그인</Link>
              <Link href="/signup" className="btn-primary text-sm">시작하기</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
