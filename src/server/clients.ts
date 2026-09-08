"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type ActionResult = { ok: true } | { ok: false; error: string };

function messageFor(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return error.message.includes("slug")
      ? "That slug is already taken — pick another."
      : "A client with that name already exists.";
  }
  return error.message;
}

export async function createClientRecord(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const hide = formData.get("hide_from_public_dropdown") != null;

  if (!name) return { ok: false, error: "Name is required." };
  const slug = slugify(slugInput || name);
  if (!slug) return { ok: false, error: "Could not build a slug from that name." };

  const serviceIds = formData
    .getAll("service_ids")
    .map(String)
    .filter(Boolean);

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      name,
      slug,
      contact_email: contactEmail || null,
      notes: notes || null,
      hide_from_public_dropdown: hide,
    })
    .select("id")
    .single();
  if (error || !client) {
    return { ok: false, error: messageFor(error ?? { message: "Insert failed" }) };
  }

  if (serviceIds.length > 0) {
    const { error: aErr } = await supabase.from("client_services").insert(
      serviceIds.map((service_id, i) => ({
        client_id: client.id,
        service_id,
        sort_order: i,
        is_active: true,
      })),
    );
    if (aErr) {
      return {
        ok: false,
        error: `Client created, but assigning services failed: ${aErr.message}`,
      };
    }
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateClientRecord(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id) return { ok: false, error: "Missing client id." };
  if (!name) return { ok: false, error: "Name is required." };
  if (!slug) return { ok: false, error: "Could not build a slug from that name." };

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      slug,
      contact_email: contactEmail || null,
      notes: notes || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: messageFor(error) };

  // Reconcile service assignments against the checked boxes.
  const checked = new Set(
    formData.getAll("service_ids").map(String).filter(Boolean),
  );
  const { data: existing } = await supabase
    .from("client_services")
    .select("service_id, sort_order")
    .eq("client_id", id);
  const existingIds = new Set((existing ?? []).map((r) => r.service_id));

  const toAdd = [...checked].filter((sid) => !existingIds.has(sid));
  const toRemove = [...existingIds].filter((sid) => !checked.has(sid));
  const maxOrder = Math.max(
    -1,
    ...(existing ?? []).map((r) => r.sort_order),
  );

  if (toAdd.length > 0) {
    const { error: aErr } = await supabase.from("client_services").insert(
      toAdd.map((service_id, i) => ({
        client_id: id,
        service_id,
        sort_order: maxOrder + 1 + i,
        is_active: true,
      })),
    );
    if (aErr) return { ok: false, error: aErr.message };
  }
  if (toRemove.length > 0) {
    const { error: dErr } = await supabase
      .from("client_services")
      .delete()
      .eq("client_id", id)
      .in("service_id", toRemove);
    if (dErr) return { ok: false, error: dErr.message };
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  return { ok: true };
}

export async function setClientFlag(
  id: string,
  field: "is_active" | "hide_from_public_dropdown",
  value: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const patch =
    field === "is_active"
      ? { is_active: value }
      : { hide_from_public_dropdown: value };
  const { error } = await supabase.from("clients").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  return { ok: true };
}
