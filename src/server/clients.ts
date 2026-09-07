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

  const { error } = await supabase.from("clients").insert({
    name,
    slug,
    contact_email: contactEmail || null,
    notes: notes || null,
    hide_from_public_dropdown: hide,
  });
  if (error) return { ok: false, error: messageFor(error) };

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
