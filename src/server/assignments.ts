"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/server/clients";

/** Assign a service to a client, appended at the end of the sort order. */
export async function assignService(
  clientId: string,
  serviceId: string,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("client_services")
    .select("sort_order")
    .eq("client_id", clientId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("client_services")
    .upsert(
      {
        client_id: clientId,
        service_id: serviceId,
        sort_order: nextOrder,
        is_active: true,
      },
      { onConflict: "client_id,service_id" },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  return { ok: true };
}

export async function unassignService(
  clientId: string,
  serviceId: string,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("client_services")
    .delete()
    .eq("client_id", clientId)
    .eq("service_id", serviceId);
  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "This service has feedback for this client. Deactivate the assignment instead of removing it.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  return { ok: true };
}

/** Persist a new order. `serviceIds` is the full ordered list of assigned services. */
export async function reorderServices(
  clientId: string,
  serviceIds: string[],
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const updates = serviceIds.map((serviceId, index) =>
    supabase
      .from("client_services")
      .update({ sort_order: index })
      .eq("client_id", clientId)
      .eq("service_id", serviceId),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}
