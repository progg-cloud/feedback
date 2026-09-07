import { clsx } from "@/lib/clsx";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-line bg-paper p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EyebrowHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : undefined}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-[1.75rem] font-display tracking-tight text-ink-soft">
        {title}
      </h2>
      <span className={clsx("rule mt-3", center && "rule-center")} />
      {subtitle ? (
        <p className="mt-3 max-w-prose text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}
