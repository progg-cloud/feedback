/** End-to-end smoke test against the running dev server + Supabase. Seeds, tests, cleans up. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(URL_, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const BASE = "http://localhost:3000";
const log = (...a) => console.log(...a);
let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; log("  ✓", name); } else { fail++; log("  ✗ FAIL:", name); } };

// --- seed ---
const { data: svc } = await admin.from("services").insert([
  { name: "SMOKE Video Editing", description: "Cutting & polishing" },
  { name: "SMOKE Meta Ads" },
]).select();
const { data: cli } = await admin.from("clients").insert({
  name: "SMOKE Neil Guides", slug: "smoke-neil-guides", hide_from_public_dropdown: false,
}).select().single();
await admin.from("client_services").insert([
  { client_id: cli.id, service_id: svc[0].id, sort_order: 1 },
  { client_id: cli.id, service_id: svc[1].id, sort_order: 0 },
]);
log("seeded client", cli.slug);

try {
  // --- public dropdown route ---
  const home = await fetch(`${BASE}/`).then((r) => r.text());
  check("home lists the seeded client", home.includes("SMOKE Neil Guides"));

  // --- private link route ---
  const form = await fetch(`${BASE}/f/smoke-neil-guides`).then((r) => r.text());
  check("form page renders client name", form.includes("Feedback for SMOKE Neil Guides"));
  check("form shows both services", form.includes("SMOKE Video Editing") && form.includes("SMOKE Meta Ads"));
  check("Meta Ads (sort_order 0) appears before Video Editing", form.indexOf("SMOKE Meta Ads") < form.indexOf("SMOKE Video Editing"));

  // --- get_portal_client via anon RPC (what the server component calls) ---
  const { data: portal } = await anon.rpc("get_portal_client", { p_slug: "smoke-neil-guides" });
  check("get_portal_client returns 2 ordered services", portal?.services?.length === 2 && portal.services[0].name === "SMOKE Meta Ads");

  // --- submit via anon RPC (what the form action calls) ---
  const period = new Date().toISOString().slice(0, 7) + "-01";
  const { data: subId, error: subErr } = await anon.rpc("submit_feedback", {
    p_client_id: cli.id, p_period_month: period,
    p_submitted_by_name: "Neil", p_submitted_by_email: "",
    p_what_went_wrong: "Slow turnaround", p_what_can_we_improve: "Faster drafts", p_overall_comment: "",
    p_ratings: [
      { service_id: svc[0].id, rating: 4, comment: "good" },
      { service_id: svc[1].id, rating: 2, comment: null },
    ],
  });
  check("submit_feedback succeeds", !subErr && !!subId);

  // --- get_feedback_for_edit ---
  const { data: edit } = await anon.rpc("get_feedback_for_edit", { p_client_id: cli.id, p_period_month: period });
  check("get_feedback_for_edit returns saved ratings", edit?.ratings?.length === 2 && edit.submission.average_rating === 3);

  // --- "already submitted" state on the page ---
  const form2 = await fetch(`${BASE}/f/smoke-neil-guides`).then((r) => r.text());
  check("form now shows already-submitted state", /already submitted|Already submitted/i.test(form2));

  // --- anon cannot read feedback tables directly ---
  const { data: leak } = await anon.from("feedback_submissions").select("*");
  check("anon cannot read feedback_submissions", !leak || leak.length === 0);
  const { data: leakClients } = await anon.from("clients").select("*").eq("id", cli.id);
  check("anon CAN read this non-hidden client row", leakClients?.length === 1);

  // --- reporting views via service role ---
  const { data: vsm } = await admin.from("v_service_monthly").select("*").eq("client_id", cli.id);
  check("v_service_monthly has 2 rows", vsm?.length === 2);
} finally {
  // --- cleanup ---
  await admin.from("clients").delete().eq("id", cli.id);
  await admin.from("services").delete().like("name", "SMOKE %");
  const { count: c1 } = await admin.from("clients").select("*", { count: "exact", head: true });
  const { count: c2 } = await admin.from("services").select("*", { count: "exact", head: true });
  const { count: c3 } = await admin.from("feedback_submissions").select("*", { count: "exact", head: true });
  log(`cleaned up — clients:${c1} services:${c2} submissions:${c3}`);
}

log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
