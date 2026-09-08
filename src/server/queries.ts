import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@db";

export type ClientRow = Tables<"clients">;
export type ServiceRow = Tables<"services">;

export type ClientOverview = ClientRow & {
  service_count: number;
  assigned_service_ids: string[];
  last_period: string | null;
  latest_average: number | null;
};

export async function listClientsOverview(): Promise<ClientOverview[]> {
  const supabase = await createClient();

  const [{ data: clients, error: cErr }, { data: assigns }, { data: subs }] =
    await Promise.all([
      supabase.from("clients").select("*").order("name"),
      supabase
        .from("client_services")
        .select("client_id, service_id")
        .eq("is_active", true),
      supabase
        .from("feedback_submissions")
        .select("client_id, period_month, average_rating")
        .order("period_month", { ascending: false }),
    ]);
  if (cErr) throw cErr;

  const servicesByClient = new Map<string, string[]>();
  for (const a of assigns ?? []) {
    const list = servicesByClient.get(a.client_id) ?? [];
    list.push(a.service_id);
    servicesByClient.set(a.client_id, list);
  }
  const latestByClient = new Map<
    string,
    { period_month: string; average_rating: number | null }
  >();
  for (const s of subs ?? []) {
    if (!latestByClient.has(s.client_id)) {
      latestByClient.set(s.client_id, {
        period_month: s.period_month,
        average_rating: s.average_rating,
      });
    }
  }

  return (clients ?? []).map((c) => {
    const assigned = servicesByClient.get(c.id) ?? [];
    return {
      ...c,
      service_count: assigned.length,
      assigned_service_ids: assigned,
      last_period: latestByClient.get(c.id)?.period_month ?? null,
      latest_average: latestByClient.get(c.id)?.average_rating ?? null,
    };
  });
}

/** Active services (id, name, description) for the client-assignment checklist. */
export async function listActiveServices(): Promise<
  Pick<ServiceRow, "id" | "name" | "description">[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getClient(id: string): Promise<ClientRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ServiceOverview = ServiceRow & {
  client_count: number;
  has_ratings: boolean;
};

export async function listServicesOverview(): Promise<ServiceOverview[]> {
  const supabase = await createClient();
  const [{ data: services, error }, { data: assigns }, { data: ratings }] =
    await Promise.all([
      supabase.from("services").select("*").order("name"),
      supabase
        .from("client_services")
        .select("service_id")
        .eq("is_active", true),
      supabase.from("feedback_ratings").select("service_id"),
    ]);
  if (error) throw error;

  const clientCount = new Map<string, number>();
  for (const a of assigns ?? []) {
    clientCount.set(a.service_id, (clientCount.get(a.service_id) ?? 0) + 1);
  }
  const rated = new Set((ratings ?? []).map((r) => r.service_id));

  return (services ?? []).map((s) => ({
    ...s,
    client_count: clientCount.get(s.id) ?? 0,
    has_ratings: rated.has(s.id),
  }));
}

export type AssignedService = {
  service_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export async function getClientAssignments(clientId: string): Promise<{
  assigned: AssignedService[];
  available: ServiceRow[];
}> {
  const supabase = await createClient();
  const [{ data: links, error }, { data: allServices }] = await Promise.all([
    supabase
      .from("client_services")
      .select("service_id, sort_order, is_active, services(name, description)")
      .eq("client_id", clientId)
      .order("sort_order"),
    supabase.from("services").select("*").eq("is_active", true).order("name"),
  ]);
  if (error) throw error;

  type Link = {
    service_id: string;
    sort_order: number;
    is_active: boolean;
    services: { name: string; description: string | null } | null;
  };

  const assigned: AssignedService[] = ((links as Link[]) ?? []).map((l) => ({
    service_id: l.service_id,
    name: l.services?.name ?? "(unknown service)",
    description: l.services?.description ?? null,
    sort_order: l.sort_order,
    is_active: l.is_active,
  }));

  const assignedIds = new Set(assigned.map((a) => a.service_id));
  const available = (allServices ?? []).filter((s) => !assignedIds.has(s.id));

  return { assigned, available };
}
