/**
 * Design tokens for TS/JS use (charts, inline styles).
 * Keep in sync with the @theme block in src/app/globals.css.
 */
export const colors = {
  brand: "#e8262c",
  brandDark: "#ff3b41",
  brandTint: "#24100f",
  ink: "#050505",
  inkSoft: "#f4f4f5",
  paper: "#141414",
  field: "#0d0d0d",
  mist: "#0a0a0a",
  cream: "#16130f",
  line: "#262626",
  muted: "#9a9a9a",
  mutedDark: "#6b6b6b",
  ok: "#34d058",
  warn: "#e0a533",
  bad: "#f0483e",
} as const;

/** Colour for a 1–5 rating cell (heatmap / badges). */
export function ratingColor(rating: number | null | undefined): string {
  if (rating == null) return colors.line;
  if (rating >= 3.5) return colors.ok;
  if (rating >= 2.5) return colors.warn;
  return colors.bad;
}

export const typeScale = {
  eyebrow: "0.7rem",
  body: "1rem",
  h1: "2.25rem",
  h2: "1.75rem",
  h3: "1.25rem",
} as const;
