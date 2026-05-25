"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function SearchInput({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/browse${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <form onSubmit={submit} className="flex gap-2 w-full md:w-96">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="K-Pop, 비즈니스, 음식..."
          className="input pl-9"
        />
      </div>
      <button className="btn-primary">검색</button>
    </form>
  );
}
