export function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function formatKrw(n: number) {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(n);
}

export function durationMinutes(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// Format a Date as "yyyy-MM-dd HH:mm" in a deterministic way (no timezone surprises in SSR).
export function fmtDateTime(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fmtTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const KOREAN_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function dayLabel(dow: number) {
  return KOREAN_DAYS[dow] ?? "?";
}

export function average(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
