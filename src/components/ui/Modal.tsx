"use client";

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
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

  if (!open) return null;

  return (
    <div
      className="anim-fade fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      {/* Flex wrapper: centres the panel and lets tall content scroll with
          padding preserved top and bottom. */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="anim-pop w-full max-w-lg rounded-2xl border border-[color:var(--color-line-strong)] bg-raised p-6 shadow-2xl ring-1 ring-white/5"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
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
          {children}
        </div>
      </div>
    </div>
  );
}
