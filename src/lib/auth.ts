import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminClaims = {
  sub: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
};

/**
 * Ensures the request comes from an authenticated admin. Call at the top
 * of every admin server action and protected page/loader. Uses getClaims()
 * for a local JWT check (no network round-trip on the hot path). Redirects
 * to /login when there is no session.
 */
export async function requireAdmin(): Promise<AdminClaims> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) redirect("/login");
  return data.claims as AdminClaims;
}
