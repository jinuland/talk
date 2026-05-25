"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function RegenerateAgendaButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    await fetch("/api/agenda/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={go} disabled={loading} className="btn-ghost text-sm">
      <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      {loading ? "생성 중…" : "다시 생성"}
    </button>
  );
}
