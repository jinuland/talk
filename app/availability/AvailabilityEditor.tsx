"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dayLabel, pad } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

type Slot = { id?: string; dayOfWeek: number; startHour: number; endHour: number };

export function AvailabilityEditor({ initial }: { initial: Slot[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function addSlot(dow: number) {
    setSlots((prev) => [...prev, { dayOfWeek: dow, startHour: 19, endHour: 22 }]);
  }
  function update(i: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function remove(i: number) {
    setSlots((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setLoading(true); setSaved(false);
    // Light client-side validation
    const cleaned = slots
      .filter((s) => s.endHour > s.startHour && s.startHour >= 0 && s.endHour <= 24)
      .map((s) => ({ dayOfWeek: s.dayOfWeek, startHour: s.startHour, endHour: s.endHour }));
    const res = await fetch("/api/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: cleaned }),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
        <div key={dow} className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold w-16">{dayLabel(dow)}요일</div>
            <button onClick={() => addSlot(dow)} className="btn-ghost text-sm">
              <Plus size={14} /> 시간대 추가
            </button>
          </div>
          <div className="space-y-2">
            {slots
              .map((s, i) => ({ s, i }))
              .filter(({ s }) => s.dayOfWeek === dow)
              .map(({ s, i }) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    className="input w-28"
                    value={s.startHour}
                    onChange={(e) => update(i, { startHour: Number(e.target.value) })}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{pad(h)}:00</option>
                    ))}
                  </select>
                  <span>—</span>
                  <select
                    className="input w-28"
                    value={s.endHour}
                    onChange={(e) => update(i, { endHour: Number(e.target.value) })}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h + 1} value={h + 1}>{pad(h + 1)}:00</option>
                    ))}
                  </select>
                  <button onClick={() => remove(i)} className="ml-auto text-ink-500 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            {slots.filter((s) => s.dayOfWeek === dow).length === 0 && (
              <div className="text-sm text-ink-500">이 요일은 가능 시간이 없습니다.</div>
            )}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={loading} className="btn-primary">
          {loading ? "저장 중…" : "저장"}
        </button>
        {saved && <span className="text-sm text-green-600">저장되었습니다.</span>}
      </div>
    </div>
  );
}
