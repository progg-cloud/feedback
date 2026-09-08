"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { clsx } from "@/lib/clsx";

const widths = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: keyof typeof widths;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // `open` only ever flips to true from a client-side click, so document
  // is always present here; the guard is just belt-and-braces for SSR.
  if (!open || typeof document === "undefined") return null;

  // Rendered into <body> so no ancestor transform / overflow can clip it.
  return createPortal(
    <div
      className="anim-fade fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          "anim-pop my-auto flex max-h-[calc(100svh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-[color:var(--color-line-strong)] bg-raised shadow-2xl ring-1 ring-white/5",
          widths[size],
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="text-lg font-display text-ink-soft">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focusable -m-1 shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-white/5 hover:text-ink-soft"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
