import { clsx } from "@/lib/clsx";
import { ratingColor } from "@/lib/theme";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "bad" | "brand";
  className?: string;
}) {
  const tones = {
    neutral: "bg-mist text-muted",
    ok: "bg-[color:var(--color-ok)]/12 text-[color:var(--color-ok)]",
    warn: "bg-[color:var(--color-warn)]/12 text-[color:var(--color-warn)]",
    bad: "bg-[color:var(--color-bad)]/12 text-[color:var(--color-bad)]",
    brand: "bg-brand-tint text-brand",
  } as const;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small coloured pill showing a numeric rating (green/amber/red). */
export function RatingBadge({ value }: { value: number | null | undefined }) {
  if (value == null) {
    return <span className="text-sm text-muted-dark">—</span>;
  }
  return (
    <span
      className="inline-flex min-w-[2.5rem] items-center justify-center rounded-md px-2 py-0.5 text-sm font-bold text-white"
      style={{ backgroundColor: ratingColor(value) }}
    >
      {value.toFixed(value % 1 === 0 ? 0 : 1)}
    </span>
  );
}
