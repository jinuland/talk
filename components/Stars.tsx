import { Star } from "lucide-react";

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= rounded;
        const half = !filled && i - 0.5 === rounded;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="text-ink-300" />
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden text-brand-500"
                style={{ width: half ? size / 2 : size }}
              >
                <Star size={size} className="fill-current text-brand-500" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
