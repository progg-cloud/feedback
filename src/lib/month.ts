/**
 * Month helpers. Submissions are keyed by `period_month`, always the
 * 1st of the month as an ISO date string ("2026-09-01").
 */

/** First day of the month for a given date, as "YYYY-MM-01". */
export function toPeriodMonth(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** Current month as "YYYY-MM-01". */
export function currentPeriodMonth(): string {
  return toPeriodMonth(new Date());
}

/** "2026-09-01" -> "September 2026". */
export function formatPeriodMonth(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "2026-09-01" -> "Sep 2026" (compact, for chart axes / headers). */
export function formatPeriodMonthShort(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Value for a <input type="month"> from a period string. "2026-09-01" -> "2026-09". */
export function periodToMonthInput(period: string): string {
  return period.slice(0, 7);
}

/** "2026-09" (from <input type="month">) -> "2026-09-01". */
export function monthInputToPeriod(value: string): string {
  return `${value}-01`;
}

/** The N most recent months, oldest first, as period strings. */
export function recentMonths(count: number, from: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    out.push(toPeriodMonth(d));
  }
  return out;
}
