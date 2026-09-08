import { clsx } from "@/lib/clsx";

const inputClass =
  "focusable w-full rounded-lg border border-[color:var(--color-line-strong)] bg-field px-3 py-2.5 text-sm text-ink-soft placeholder:text-muted-dark transition-colors hover:border-white/25 focus:border-brand";

export function Label({
  children,
  htmlFor,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-sm font-medium text-ink-soft"
    >
      {children}
      {hint ? (
        <span className="ml-2 font-normal text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(inputClass, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(inputClass, "min-h-[90px] resize-y", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} hint={hint}>
        {label}
      </Label>
      {children}
      {error ? (
        <p className="mt-1 text-sm text-[color:var(--color-bad)]">{error}</p>
      ) : null}
    </div>
  );
}
