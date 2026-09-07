import "server-only";
import { createClient } from "@/lib/supabase/server";
import { formatPeriodMonthShort } from "@/lib/month";

/* ----------------------------- Service report ---------------------------- */

export type ServiceScore = {
  service_id: string;
  service_name: string;
  average: number;
  responses: number;
  lows: { client_name: string; period: string; rating: number; comment: string | null }[];
};

export async function getServiceReport(): Promise<ServiceScore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_service_monthly")
    .select("service_id, service_name, client_name, period_month, rating, comment");
  if (error) throw error;

  const map = new Map<string, ServiceScore>();
  for (const r of data ?? []) {
    if (r.service_id == null || r.rating == null) continue;
    const cur =
      map.get(r.service_id) ??
      ({
        service_id: r.service_id,
        service_name: r.service_name ?? "(service)",
        average: 0,
        responses: 0,
        lows: [],
      } as ServiceScore);
    cur.average += r.rating;
    cur.responses += 1;
    if (r.rating <= 2) {
      cur.lows.push({
        client_name: r.client_name ?? "(client)",
        period: r.period_month ?? "",
        rating: r.rating,
        comment: r.comment,
      });
    }
    map.set(r.service_id, cur);
  }

  return [...map.values()]
    .map((s) => ({
      ...s,
      average: Math.round((s.average / s.responses) * 100) / 100,
      lows: s.lows.sort((a, b) => b.period.localeCompare(a.period)),
    }))
    .sort((a, b) => a.average - b.average);
}

/* ------------------------------ Client report --------------------------- */

export type ClientReport = {
  trend: { month: string; label: string; average: number | null }[];
  heatmap: {
    services: string[];
    months: { key: string; label: string }[];
    cells: Record<string, Record<string, number>>; // service -> month -> rating
  };
  narrative: {
    period: string;
    what_went_wrong: string | null;
    what_can_we_improve: string | null;
    overall_comment: string | null;
  }[];
  serviceComments: { service: string; period: string; comment: string }[];
};

export async function getClientReport(clientId: string): Promise<ClientReport> {
  const supabase = await createClient();

  const [{ data: subs }, { data: svc }] = await Promise.all([
    supabase
      .from("feedback_submissions")
      .select(
        "period_month, average_rating, what_went_wrong, what_can_we_improve, overall_comment",
      )
      .eq("client_id", clientId)
      .order("period_month", { ascending: true }),
    supabase
      .from("v_service_monthly")
      .select("service_name, period_month, rating, comment")
      .eq("client_id", clientId),
  ]);

  const trend = (subs ?? []).map((s) => ({
    month: s.period_month,
    label: formatPeriodMonthShort(s.period_month),
    average: s.average_rating != null ? Number(s.average_rating) : null,
  }));

  const monthSet = new Map<string, string>();
  const serviceSet = new Set<string>();
  const cells: Record<string, Record<string, number>> = {};
  const serviceComments: ClientReport["serviceComments"] = [];

  for (const r of svc ?? []) {
    if (!r.service_name || !r.period_month || r.rating == null) continue;
    monthSet.set(r.period_month, formatPeriodMonthShort(r.period_month));
    serviceSet.add(r.service_name);
    cells[r.service_name] ??= {};
    cells[r.service_name][r.period_month] = r.rating;
    if (r.comment) {
      serviceComments.push({
        service: r.service_name,
        period: r.period_month,
        comment: r.comment,
      });
    }
  }

  const months = [...monthSet.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, label]) => ({ key, label }));

  const narrative = (subs ?? [])
    .filter(
      (s) =>
        s.what_went_wrong || s.what_can_we_improve || s.overall_comment,
    )
    .sort((a, b) => b.period_month.localeCompare(a.period_month))
    .map((s) => ({
      period: s.period_month,
      what_went_wrong: s.what_went_wrong,
      what_can_we_improve: s.what_can_we_improve,
      overall_comment: s.overall_comment,
    }));

  return {
    trend,
    heatmap: { services: [...serviceSet].sort(), months, cells },
    narrative,
    serviceComments: serviceComments.sort((a, b) =>
      b.period.localeCompare(a.period),
    ),
  };
}
