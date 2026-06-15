"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dayLabel, pad } from "@/lib/utils";
import { Eraser, Save } from "lucide-react";

type Slot = { dayOfWeek: number; startHour: number; endHour: number };

function cellKey(day: number, hour: number) {
  return `${day}-${hour}`;
}

function slotsToCells(slots: Slot[]): Set<string> {
  const out = new Set<string>();
  for (const s of slots) {
    for (let h = s.startHour; h < s.endHour; h++) {
      out.add(cellKey(s.dayOfWeek, h));
    }
  }
  return out;
}

function cellsToSlots(cells: Set<string>): Slot[] {
  const out: Slot[] = [];
  for (let day = 0; day < 7; day++) {
    let start: number | null = null;
    for (let h = 0; h <= 24; h++) {
      const has = h < 24 && cells.has(cellKey(day, h));
      if (has && start === null) start = h;
      else if (!has && start !== null) {
        out.push({ dayOfWeek: day, startHour: start, endHour: h });
        start = null;
      }
    }
  }
  return out;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = [0, 1, 2, 3, 4, 5, 6]; // Sun..Sat

export function AvailabilityEditor({ initial }: { initial: Slot[] }) {
  const router = useRouter();
  const [cells, setCells] = useState<Set<string>>(() => slotsToCells(initial));
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Drag state — refs to avoid re-render on every cell enter
  const dragModeRef = useRef<"add" | "remove" | null>(null);
  const touchedRef = useRef<Set<string>>(new Set());

  const beginDrag = useCallback(
    (day: number, hour: number) => {
      const key = cellKey(day, hour);
      const mode: "add" | "remove" = cells.has(key) ? "remove" : "add";
      dragModeRef.current = mode;
      touchedRef.current = new Set([key]);
      setCells((prev) => {
        const next = new Set(prev);
        if (mode === "add") next.add(key);
        else next.delete(key);
        return next;
      });
      setSaved(false);
    },
    [cells]
  );

  const dragOver = useCallback((day: number, hour: number) => {
    const mode = dragModeRef.current;
    if (!mode) return;
    const key = cellKey(day, hour);
    if (touchedRef.current.has(key)) return;
    touchedRef.current.add(key);
    setCells((prev) => {
      const next = new Set(prev);
      if (mode === "add") next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const endDrag = useCallback(() => {
    dragModeRef.current = null;
    touchedRef.current.clear();
  }, []);

  // Touch: identify cell under the finger via elementFromPoint
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragModeRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
      if (!el) return;
      const dayAttr = el.dataset.day;
      const hourAttr = el.dataset.hour;
      if (dayAttr != null && hourAttr != null) {
        dragOver(Number(dayAttr), Number(hourAttr));
      }
    },
    [dragOver]
  );

  function clearAll() {
    setCells(new Set());
    setSaved(false);
  }

  function applyPreset(preset: "weekdayEvening" | "weekendAfternoon") {
    setCells((prev) => {
      const next = new Set(prev);
      if (preset === "weekdayEvening") {
        for (const day of [1, 2, 3, 4, 5]) for (let h = 19; h < 22; h++) next.add(cellKey(day, h));
      } else {
        for (const day of [0, 6]) for (let h = 14; h < 18; h++) next.add(cellKey(day, h));
      }
      return next;
    });
    setSaved(false);
  }

  async function save() {
    setLoading(true);
    setSaved(false);
    const slots = cellsToSlots(cells);
    const res = await fetch("/api/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots }),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  const totalHours = cells.size;

  return (
    <div className="space-y-4">
      <div className="card p-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-500">빠른 채우기:</span>
        <button onClick={() => applyPreset("weekdayEvening")} className="btn-ghost text-xs">
          평일 저녁 (월~금 19~22)
        </button>
        <button onClick={() => applyPreset("weekendAfternoon")} className="btn-ghost text-xs">
          주말 오후 (토·일 14~18)
        </button>
        <button onClick={clearAll} className="btn-ghost text-xs ml-auto text-ink-500">
          <Eraser size={14} /> 전체 지우기
        </button>
      </div>

      <div className="card p-3 select-none">
        <div className="flex items-center justify-between text-xs text-ink-500 mb-2 px-1">
          <span>드래그해서 가능 시간 칠하기 · 칠해진 칸을 드래그하면 지워짐</span>
          <span>{totalHours}시간 / 주</span>
        </div>

        <div
          className="grid touch-none"
          style={{
            gridTemplateColumns: "44px repeat(7, minmax(0, 1fr))",
          }}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onTouchMove={onTouchMove}
          onTouchEnd={endDrag}
          onTouchCancel={endDrag}
        >
          {/* Top-left empty corner */}
          <div className="sticky top-0 bg-white z-10" />
          {/* Day headers */}
          {DAYS.map((d) => (
            <div
              key={`h-${d}`}
              className={`sticky top-0 bg-white z-10 text-center text-xs font-medium py-1 ${
                d === 0 || d === 6 ? "text-brand-600" : "text-ink-700"
              }`}
            >
              {dayLabel(d)}
            </div>
          ))}

          {/* Body rows */}
          {HOURS.map((h) => (
            <Row key={`r-${h}`} hour={h} cells={cells} onDown={beginDrag} onEnter={dragOver} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={loading} className="btn-primary">
          <Save size={16} /> {loading ? "저장 중…" : "저장"}
        </button>
        {saved && <span className="text-sm text-green-600">저장되었습니다.</span>}
      </div>
    </div>
  );
}

function Row({
  hour,
  cells,
  onDown,
  onEnter,
}: {
  hour: number;
  cells: Set<string>;
  onDown: (day: number, hour: number) => void;
  onEnter: (day: number, hour: number) => void;
}) {
  return (
    <>
      <div className="text-right pr-2 py-0 text-[10px] text-ink-500 leading-[28px]">
        {pad(hour)}:00
      </div>
      {DAYS.map((d) => {
        const filled = cells.has(cellKey(d, hour));
        return (
          <div
            key={`c-${d}-${hour}`}
            data-day={d}
            data-hour={hour}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              onDown(d, hour);
            }}
            onPointerEnter={() => onEnter(d, hour)}
            className={`h-7 border-t border-r border-ink-100 cursor-pointer transition-colors ${
              d === 6 ? "border-r-0" : ""
            } ${
              filled
                ? "bg-brand-500 hover:bg-brand-600"
                : (d === 0 || d === 6)
                ? "bg-ink-100/40 hover:bg-brand-100"
                : "bg-white hover:bg-brand-50"
            }`}
          />
        );
      })}
    </>
  );
}
