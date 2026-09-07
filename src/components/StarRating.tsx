"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";

function Star({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
}

/**
 * Accessible 5-star input. Comfortable mobile tap targets (44px),
 * hover + keyboard support. Renders a radiogroup.
 */
export function StarRating({
  name,
  value,
  onChange,
  disabled = false,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      role="radiogroup"
      aria-label="Rating out of 5"
      className="inline-flex"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          disabled={disabled}
          className="focusable grid h-11 w-11 place-items-center rounded-md disabled:opacity-50"
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <Star
            filled={n <= shown}
            className={clsx(
              "h-7 w-7 transition-colors",
              n <= shown ? "text-brand" : "text-muted-dark",
            )}
          />
        </button>
      ))}
      <input type="hidden" name={name} value={value || ""} />
    </div>
  );
}
