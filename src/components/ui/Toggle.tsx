"use client";

import { useTransition } from "react";
import { clsx } from "@/lib/clsx";

/** A switch that fires an async action on change. Optimistic-ish: disabled while pending. */
export function Toggle({
  checked,
  onToggle,
  label,
  disabled = false,
}: {
  checked: boolean;
  onToggle: (next: boolean) => Promise<{ ok: boolean; error?: string }>;
  label: string;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      const res = await onToggle(!checked);
      if (!res.ok && res.error) alert(res.error);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || pending}
      onClick={handle}
      className={clsx(
        "focusable relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-brand" : "bg-line",
      )}
    >
      <span
        className={clsx(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
