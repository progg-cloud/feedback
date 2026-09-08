"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/server/clients";

export async function createService(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };

  const { error } = await supabase
    .from("services")
    .insert({ name, description: description || null });
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "A service with that name already exists."
          : error.message,
    };
  }
  revalidatePath("/admin/services");
  return { ok: true };
}

export async function updateService(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!id) return { ok: false, error: "Missing service id." };
  if (!name) return { ok: false, error: "Name is required." };

  const { error } = await supabase
    .from("services")
    .update({ name, description: description || null })
    .eq("id", id);
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "A service with that name already exists."
          : error.message,
    };
  }
  revalidatePath("/admin/services");
  return { ok: true };
}

export async function setServiceActive(
  id: string,
  value: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: value })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/services");
  return { ok: true };
}

/**
 * Delete a service. If it has feedback ratings, `force` must be true — those
 * ratings are stripped first (the FK is ON DELETE RESTRICT). Assignments to
 * clients are removed automatically (ON DELETE CASCADE).
 */
export async function deleteService(
  id: string,
  force = false,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { count, error: countErr } = await supabase
    .from("feedback_ratings")
    .select("id", { count: "exact", head: true })
    .eq("service_id", id);
  if (countErr) return { ok: false, error: countErr.message };

  if ((count ?? 0) > 0) {
    if (!force) {
      return {
        ok: false,
        error:
          "This service has feedback attached. Confirm again to delete it and its ratings.",
      };
    }
    const { error: rErr } = await supabase
      .from("feedback_ratings")
      .delete()
      .eq("service_id", id);
    if (rErr) return { ok: false, error: rErr.message };
  }

  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/services");
  revalidatePath("/admin/services/report");
  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  return { ok: true };
}
