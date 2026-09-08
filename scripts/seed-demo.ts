/**
 * DEMO / TEST DATA — not for production.
 *
 *   npm run seed:demo         populate the portal with a demo client,
 *                             7 services and 6 months of feedback history
 *   npm run seed:demo:clean   remove every trace of it
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local
 * and writes with the service-role key (bypasses RLS). It ONLY ever touches
 * the `test-client` slug and the seven services named below — nothing else.
 *
 * The production migration stays empty; this file is the only place demo
 * rows come from. Run seed:demo:clean before launch (see README).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types/database.types";

// ---------------------------------------------------------------- env
for (const line of readFileSync(
  fileURLToPath(new URL("../.env.local", import.meta.url)),
  "utf8",
).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}
const db = createClient<Database>(url, key, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------- fixtures
const DEMO_CLIENT = {
  name: "Test Client (Demo)",
  slug: "test-client",
  contact_email: "demo@example.com",
  notes: "Demo data for internal review — delete before launch",
  hide_from_public_dropdown: false,
  is_active: true,
};

// Order matters — it becomes the sort_order on the form and the column
// order in the matrix below.
const DEMO_SERVICES = [
  "Meta Ads Support",
  "Google Ads Support",
  "Social Media Posting",
  "Video Editing",
  "Creative Direction",
  "Lead Quality",
  "Project Manager Support",
] as const;

// Six months, oldest first. Story: 3.6 -> dip to 2.7 -> recover to 4.6.
// Lead Quality (index 5) stays weak; Project Manager Support (6) stays strong.
const MATRIX: number[][] = [
  [4, 4, 3, 4, 3, 2, 5], // avg 3.57
  [4, 3, 3, 3, 3, 2, 5], // avg 3.29
  [3, 2, 3, 3, 2, 1, 5], // avg 2.71  <- dip, three red cells
  [3, 3, 3, 4, 3, 2, 4], // avg 3.14
  [4, 4, 4, 4, 3, 3, 5], // avg 3.86
  [5, 5, 4, 5, 5, 3, 5], // avg 4.57
];

// Sparse per-service comments, keyed "<monthIndex>:<serviceIndex>".
const COMMENTS: Record<string, string> = {
  "0:5": "Lead volume was fine but quality dropped.",
  "1:5": "Still getting a lot of tyre-kickers — not much changed.",
  "2:1": "Spend was up but conversions didn't follow.",
  "2:4": "Concepts felt rushed and off-brand this month.",
  "2:5": "Barely any usable leads — this needs urgent attention.",
  "3:5": "Slight improvement but still below where we need it.",
  "4:4": "Getting back on track — the last few pieces were solid.",
  "5:3": "Turnaround and quality both excellent this month.",
  "5:5": "Noticeable step up — the new qualification questions are helping.",
};

const NARRATIVE = [
  {
    by_name: "Priya Sharma",
    by_email: "priya@testclient.example",
    wrong:
      "A couple of deadlines slipped on the video side and we had to chase for updates more than we'd like. Nothing major, but communication could have been tighter.",
    improve:
      "A short weekly summary of what's been done and what's coming up would save us a lot of back-and-forth.",
    overall: null as string | null,
  },
  {
    by_name: "Priya Sharma",
    by_email: null as string | null,
    wrong:
      "Lead quality has been a recurring frustration — we're getting the volume but the leads aren't converting. Ad spend went up without a clear explanation of why.",
    improve:
      "We need a proper breakdown of where the ad budget is going and what results each channel is actually driving.",
    overall: null,
  },
  {
    by_name: null as string | null,
    by_email: null as string | null,
    wrong:
      "This was a rough month. Lead quality basically collapsed, the Google Ads results went backwards despite higher spend, and the creative concepts we were sent felt rushed and off-brand. We also felt out of the loop on a few decisions.",
    improve:
      "We need a reset. Tighten up the lead qualification, pause and properly review the Google Ads account, and involve us earlier in the creative process before things are half-built.",
    overall: "We're seriously concerned and need to see a written plan by next week.",
  },
  {
    by_name: "Rahul Verma",
    by_email: "rahul@testclient.example",
    wrong:
      "Still not where we want to be on leads, and there were a couple of small misses on social posting timing. But it does feel like things are moving in the right direction now.",
    improve:
      "Keep the momentum on the lead-quality fixes, and give us a bit more notice before posts go live so we can flag anything.",
    overall: null,
  },
  {
    by_name: null as string | null,
    by_email: "feedback@testclient.example",
    wrong:
      "Honestly not much to complain about this month. One creative round took longer than expected, but the end result was worth the wait.",
    improve:
      "We'd love to start looking at scaling the campaigns now that the fundamentals are solid again.",
    overall: null,
  },
  {
    by_name: "Priya Sharma",
    by_email: "priya@testclient.example",
    wrong:
      "Nothing significant. This has honestly been the best month we've had with you — everything ran smoothly and the results speak for themselves.",
    improve:
      "Let's talk about increasing the budget and adding a second creative concept per campaign so we can test more.",
    overall: "Really happy with how the team turned this around. Thank you.",
  },
];

// ---------------------------------------------------------------- helpers
function periodMonths(count: number): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
    );
  }
  return out;
}

// ---------------------------------------------------------------- seed
async function seed() {
  console.log("Seeding demo data…");

  const { data: client, error: cErr } = await db
    .from("clients")
    .upsert(DEMO_CLIENT, { onConflict: "slug" })
    .select()
    .single();
  if (cErr) throw cErr;
  console.log(`  client: ${client.name} (/${client.slug})`);

  const { data: services, error: sErr } = await db
    .from("services")
    .upsert(
      DEMO_SERVICES.map((name) => ({ name })),
      { onConflict: "name" },
    )
    .select();
  if (sErr) throw sErr;
  const byName = new Map(services.map((s) => [s.name, s]));
  const ordered = DEMO_SERVICES.map((n) => byName.get(n)!);
  console.log(`  services: ${ordered.length}`);

  const { error: aErr } = await db.from("client_services").upsert(
    ordered.map((s, i) => ({
      client_id: client.id,
      service_id: s.id,
      sort_order: i,
      is_active: true,
    })),
    { onConflict: "client_id,service_id" },
  );
  if (aErr) throw aErr;
  console.log("  assignments: done");

  const months = periodMonths(6);
  for (let m = 0; m < months.length; m++) {
    const n = NARRATIVE[m];
    const { data: sub, error: subErr } = await db
      .from("feedback_submissions")
      .upsert(
        {
          client_id: client.id,
          period_month: months[m],
          submitted_by_name: n.by_name,
          submitted_by_email: n.by_email,
          what_went_wrong: n.wrong,
          what_can_we_improve: n.improve,
          overall_comment: n.overall,
        },
        { onConflict: "client_id,period_month" },
      )
      .select()
      .single();
    if (subErr) throw subErr;

    await db.from("feedback_ratings").delete().eq("submission_id", sub.id);
    const { error: rErr } = await db.from("feedback_ratings").insert(
      ordered.map((s, si) => ({
        submission_id: sub.id,
        service_id: s.id,
        rating: MATRIX[m][si],
        comment: COMMENTS[`${m}:${si}`] ?? null,
      })),
    );
    if (rErr) throw rErr;

    const avg = (MATRIX[m].reduce((a, b) => a + b, 0) / 7).toFixed(2);
    console.log(`  ${months[m]}  avg ~${avg}`);
  }

  console.log("\nDone. Visit /f/test-client or the admin dashboard.");
}

// ---------------------------------------------------------------- clean
async function clean() {
  console.log("Removing demo data…");

  const { data: client } = await db
    .from("clients")
    .select("id")
    .eq("slug", DEMO_CLIENT.slug)
    .maybeSingle();

  if (client) {
    // Cascades to client_services, feedback_submissions and feedback_ratings.
    const { error } = await db.from("clients").delete().eq("id", client.id);
    if (error) throw error;
    console.log("  removed demo client + its submissions and ratings");
  } else {
    console.log("  no demo client found");
  }

  for (const name of DEMO_SERVICES) {
    const { data: svc } = await db
      .from("services")
      .select("id")
      .eq("name", name)
      .maybeSingle();
    if (!svc) continue;

    const { count: assigned } = await db
      .from("client_services")
      .select("*", { count: "exact", head: true })
      .eq("service_id", svc.id);
    const { count: rated } = await db
      .from("feedback_ratings")
      .select("*", { count: "exact", head: true })
      .eq("service_id", svc.id);

    if ((assigned ?? 0) > 0 || (rated ?? 0) > 0) {
      console.log(`  kept "${name}" — now used by real data`);
      continue;
    }
    await db.from("services").delete().eq("id", svc.id);
    console.log(`  removed service "${name}"`);
  }

  const { count } = await db
    .from("feedback_submissions")
    .select("*", { count: "exact", head: true });
  console.log(`\nDone. feedback_submissions remaining: ${count ?? 0}`);
}

// ---------------------------------------------------------------- run
(process.argv.includes("--clean") ? clean() : seed()).catch((e) => {
  console.error(e);
  process.exit(1);
});
