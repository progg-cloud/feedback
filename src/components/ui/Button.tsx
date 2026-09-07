import Link from "next/link";
import { clsx } from "@/lib/clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "focusable inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold transition-transform transition-colors disabled:opacity-50 disabled:pointer-events-none active:translate-y-px";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_6px_22px_-10px_rgba(232,38,44,0.7)] hover:bg-brand-dark hover:-translate-y-px",
  secondary:
    "bg-paper text-ink-soft border border-line hover:border-ink-soft hover:-translate-y-px",
  ghost: "bg-transparent text-ink-soft hover:bg-white/5",
  danger:
    "bg-paper text-bad border border-[color:var(--color-bad)]/40 hover:bg-[color:var(--color-bad)]/10",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-5 py-2.5",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: CommonProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >) {
  return (
    <Link
      href={href}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
