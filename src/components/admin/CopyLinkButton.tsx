"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";

export function CopyLinkButton({
  url,
  label = "Copy link",
  className,
}: {
  url: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers / insecure contexts
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={url}
      className={clsx(
        "focusable rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        copied
          ? "border-[color:var(--color-ok)] text-[color:var(--color-ok)]"
          : "border-line text-ink-soft hover:border-ink-soft",
        className,
      )}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
