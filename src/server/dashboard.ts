import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentPeriodMonth, formatPeriodMonthShort } from "@/lib/month";

export type DashboardData = {
  currentMonth: string;
  submissionsThisMonth: number;
  overallAverage: number | null;
  pendingClients: { id: string; name: string; slug: string }[];
  trend: { month: string; label: string; average: number | null; count: number }[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const currentMonth = currentPeriodMonth();

  const [{ data: activeClients }, { data: subs }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("feedback_submissions")
      .select("client_id, period_month, average_rating")
      .order("period_month", { ascending: true }),
  ]);

  const rows = subs ?? [];
  const thisMonth = rows.filter((r) => r.period_month === currentMonth);
  const submittedClientIds = new Set(
    thisMonth.map((r) => r.client_id),
  );

  const rated = rows.filter(
    (r) => r.period_month === currentMonth && r.average_rating != null,
  );
  const overallAverage =
    rated.length > 0
      ? Math.round(
          (rated.reduce((s, r) => s + Number(r.average_rating), 0) /
            rated.length) *
            100,
        ) / 100
      : null;

  // month -> {sum, n}
  const byMonth = new Map<string, { sum: number; n: number; count: number }>();
  for (const r of rows) {
    const m = byMonth.get(r.period_month) ?? { sum: 0, n: 0, count: 0 };
    m.count += 1;
    if (r.average_rating != null) {
      m.sum += Number(r.average_rating);
      m.n += 1;
    }
    byMonth.set(r.period_month, m);
  }
  const trend = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, m]) => ({
      month,
      label: formatPeriodMonthShort(month),
      average: m.n > 0 ? Math.round((m.sum / m.n) * 100) / 100 : null,
      count: m.count,
    }));

  const pendingClients = (activeClients ?? []).filter(
    (c) => !submittedClientIds.has(c.id),
  );

  return {
    currentMonth,
    submissionsThisMonth: thisMonth.length,
    overallAverage,
    pendingClients,
    trend,
  };
}
