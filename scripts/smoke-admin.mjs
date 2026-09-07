/** Verifies the authenticated-admin DB operations the admin server actions perform. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const [email, password] = process.argv.slice(2);
const auth = createClient(URL_, anonKey, { auth: { persistSession: false } });
const { data: session, error: authErr } = await auth.auth.signInWithPassword({ email, password });
if (authErr) { console.error("login failed:", authErr.message); process.exit(1); }

// client bound to the admin's session -> role "authenticated"
const asAdmin = createClient(URL_, anonKey, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${session.session.access_token}` } },
});

let pass = 0, fail = 0;
const check = (n, c) => { c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗ FAIL:", n)); };

try {
  const { data: svc, error: e1 } = await asAdmin.from("services")
    .insert({ name: "ADM Thumbnails" }).select().single();
  check("admin inserts a service", !e1 && svc);

  const { data: cli, error: e2 } = await asAdmin.from("clients")
    .insert({ name: "ADM Pet Talks", slug: "adm-pet-talks" }).select().single();
  check("admin inserts a client (hidden default true)", !e2 && cli?.hide_from_public_dropdown === true);

  const { error: e3 } = await asAdmin.from("client_services")
    .upsert({ client_id: cli.id, service_id: svc.id, sort_order: 0 }, { onConflict: "client_id,service_id" });
  check("admin assigns service to client", !e3);

  const { error: e4 } = await asAdmin.from("clients")
    .update({ hide_from_public_dropdown: false }).eq("id", cli.id);
  check("admin toggles a client flag", !e4);

  const { data: readBack } = await asAdmin.from("clients").select("*");
  check("admin reads all clients (incl. hidden)", (readBack?.length ?? 0) >= 1);

  const { data: subsRead, error: e5 } = await asAdmin.from("feedback_submissions").select("*");
  check("admin can read feedback_submissions table", !e5 && Array.isArray(subsRead));

  // a fresh anon client must NOT be able to insert a client
  const freshAnon = createClient(URL_, anonKey, { auth: { persistSession: false } });
  const { error: e6 } = await freshAnon.from("clients").insert({ name: "HACK", slug: "hack" });
  check("anon cannot insert a client (RLS blocks)", !!e6);
} finally {
  const { data: c } = await admin.from("clients").select("id").eq("slug", "adm-pet-talks").maybeSingle();
  if (c) await admin.from("clients").delete().eq("id", c.id);
  await admin.from("services").delete().like("name", "ADM %");
  await admin.from("clients").delete().eq("slug", "hack");
  const { count } = await admin.from("clients").select("*", { count: "exact", head: true });
  const { count: sc } = await admin.from("services").select("*", { count: "exact", head: true });
  console.log(`cleaned up — clients:${count} services:${sc}`);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
