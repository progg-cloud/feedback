/** Build a CSV string from an array of flat objects. */
export function toCsv(
  rows: Record<string, unknown>[],
  columns?: string[],
): string {
  if (rows.length === 0) return "";
  const cols = columns ?? Object.keys(rows[0]);
  const cell = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(",");
  const body = rows
    .map((r) => cols.map((c) => cell(r[c])).join(","))
    .join("\r\n");
  return `${header}\r\n${body}\r\n`;
}
