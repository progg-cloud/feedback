import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@db";

/**
 * Service-role client — BYPASSES RLS. Server-only.
 * Use for admin writes/reads after we have verified the caller is an
 * authenticated admin (see requireAdmin() in src/lib/auth.ts). Never
 * import this into a Client Component.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
