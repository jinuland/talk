"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatKrw, fmtDate, pad, dayLabel } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";

type Slot = { dayOfWeek: number; startHour: number; endHour: number };
type Busy = { start: string; end: string };

type Props = {
  tutor: {
    id: string;
    name: string;
    hourlyRate: number;
    availabilities: Slot[];
    busy: Busy[];
  };
  themes: { id: string; title: string; emoji?: string | null; level: string }[];
};

// Build the list of (date, hour) slot starts available for the next 14 days.
function buildSlots(tutor: Props["tutor"], baseDate: Date): { date: Date; hour: number }[] {
  const out: { date: Date; hour: number }[] = [];
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  for (let d = 0; d < 14; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    const dow = day.getDay();
    const slots = tutor.availabilities.filter((a) => a.dayOfWeek === dow);
    for (const s of slots) {
      for (let h = s.startHour; h < s.endHour; h++) {
        const slotStart = new Date(day);
        slotStart.setHours(h, 0, 0, 0);
        if (slotStart.getTime() < Date.now() + 60 * 60 * 1000) continue; // need ≥1h lead
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
        const conflict = tutor.busy.some((b) => {
          const bs = new Date(b.start).getTime();
          const be = new Date(b.end).getTime();
          return slotStart.getTime() < be && slotEnd.getTime() > bs;
        });
        if (!conflict) out.push({ date: slotStart, hour: h });
      }
    }
  }
  return out;
}

export function BookingPanel({ tutor, themes }: Props) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<{ date: string; hour: number } | null>(null);
  const [themeId, setThemeId] = useState<string>(themes[0]?.id ?? "");
  const [customTopic, setCustomTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const base = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [weekOffset]);

  const allSlots = useMemo(() => buildSlots(tutor, base), [tutor, base]);

  // Group by date
  const byDate = useMemo(() => {
    const map = new Map<string, { date: Date; hour: number }[]>();
    for (const s of allSlots) {
      const k = fmtDate(s.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    // Keep only the 7 days in the current week window.
    const days: { key: string; date: Date; slots: { date: Date; hour: number }[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const key = fmtDate(d);
      days.push({ key, date: d, slots: map.get(key) ?? [] });
    }
    return days;
  }, [allSlots, base]);

  async function book() {
    if (!selected) { setErr("시간을 선택해 주세요."); return; }
    setLoading(true); setErr(null);
    const isoDate = selected.date;
    const startIso = `${isoDate}T${pad(selected.hour)}:00:00`;
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostId: tutor.id,
        startLocal: startIso,
        durationMinutes: 60,
        themeId: themeId || null,
        customTopic: customTopic.trim() || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "예약 생성 실패");
      setLoading(false);
      return;
    }
    const { booking, checkoutUrl } = await res.json();
    router.push(checkoutUrl ?? `/bookings/${booking.id}`);
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold flex items-center gap-2"><CalIcon size={16} /> 시간 선택</div>
        <div className="text-sm text-ink-500">{formatKrw(tutor.hourlyRate)}/시간</div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <button
          className="btn-ghost"
          onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
          disabled={weekOffset === 0}
        >
          <ChevronLeft size={14} />
        </button>
        <div className="text-ink-500">
          {fmtDate(base)} ~ {fmtDate(new Date(base.getTime() + 6 * 86400_000))}
        </div>
        <button className="btn-ghost" onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {byDate.map((d) => (
          <div key={d.key} className="space-y-1">
            <div className="text-[10px] text-ink-500">{dayLabel(d.date.getDay())}</div>
            <div className="text-xs font-medium">{d.date.getDate()}</div>
            <div className="space-y-1 mt-1">
              {d.slots.length === 0 && <div className="text-[10px] text-ink-300">—</div>}
              {d.slots.map((s) => {
                const isActive = selected?.date === d.key && selected?.hour === s.hour;
                return (
                  <button
                    key={`${d.key}-${s.hour}`}
                    onClick={() => setSelected({ date: d.key, hour: s.hour })}
                    className={`w-full text-[11px] py-1 rounded ${
                      isActive
                        ? "bg-brand-500 text-white"
                        : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    }`}
                  >
                    {pad(s.hour)}:00
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="label">테마 (AI 아젠다 생성)</label>
        <select className="input" value={themeId} onChange={(e) => setThemeId(e.target.value)}>
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.emoji ? `${t.emoji} ` : ""}
              {t.title} · {t.level}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">추가 요청 (선택)</label>
        <input
          className="input"
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="예: 발음 교정 위주로, 회의 표현 집중"
        />
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="border-t border-ink-100 pt-3 flex items-center justify-between">
        <div className="text-sm text-ink-500">
          {selected ? (
            <span>
              <strong>{selected.date} {pad(selected.hour)}:00</strong> · 60분
            </span>
          ) : (
            "시간을 선택하면 결제로 진행됩니다"
          )}
        </div>
        <div className="font-bold">{formatKrw(tutor.hourlyRate)}</div>
      </div>
      <button onClick={book} disabled={loading || !selected} className="btn-primary w-full">
        {loading ? "처리 중…" : "결제하고 예약하기"}
      </button>
    </div>
  );
}
