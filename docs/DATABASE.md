# Database — RohtreMedia Feedback Portal

Supabase project **`rohtremedia-feedback`** · ref `qdugohjjchvstfefynsy` · region `ap-southeast-1` · Postgres 17.6
API URL: `https://qdugohjjchvstfefynsy.supabase.co`

Applied via the Supabase MCP connector on 2026-09-07. Migrations are mirrored in
`supabase/migrations/`. **The database ships empty — no seed data.**

## Tables

| table | purpose | key rules |
|---|---|---|
| `clients` | agency clients | `name`/`slug` unique; `hide_from_public_dropdown` default **true**; `is_active` soft-delete |
| `services` | master service list | `name` unique; `is_active` soft-delete |
| `client_services` | which services a client receives | unique `(client_id, service_id)`; `sort_order` drives form order; cascades on client/service delete |
| `feedback_submissions` | one row per client per month | unique `(client_id, period_month)`; `period_month` **must** be the 1st (CHECK); `average_rating` auto-maintained; cascade on client delete |
| `feedback_ratings` | one row per service per submission | unique `(submission_id, service_id)`; `rating` 1–5 (CHECK); `service_id` **ON DELETE RESTRICT** — a rated service cannot be deleted |

## Trigger

`trg_recalc_avg` on `feedback_ratings` (insert/update/delete) → `recalc_submission_average()`
recomputes `feedback_submissions.average_rating` (2 dp) and bumps `updated_at`.

## Views (admin reporting, `security_invoker = true`, anon revoked)

- `v_client_monthly` — monthly average + text feedback per client
- `v_service_monthly` — per-service rating + comment per client per month

## RPCs — the only public write/read path for feedback

All three are `SECURITY DEFINER` with a fixed `search_path`, `EXECUTE` granted to `anon` + `authenticated`.

| function | args | returns |
|---|---|---|
| `get_portal_client(p_slug text)` | client slug | `{ id, name, slug, services:[{service_id,name,description,sort_order}] }` ordered by `sort_order`; **null** if slug not found / inactive. Works for hidden clients (that's the private-link point). |
| `get_feedback_for_edit(p_client_id uuid, p_period_month date)` | client + any date in the month | `{ submission:{…}, ratings:[{service_id,rating,comment}] }`; **null** if none — powers the "you've already submitted, update it?" flow |
| `submit_feedback(p_client_id, p_period_month, p_submitted_by_name, p_submitted_by_email, p_what_went_wrong, p_what_can_we_improve, p_overall_comment, p_ratings jsonb)` | `p_ratings` = `[{service_id,rating,comment?}]` | submission `uuid` |

`submit_feedback` is **atomic** (submission + all ratings in one transaction), **upserts** on `(client, month)` conflict — updating text in place and replacing ratings wholesale — normalises the month to the 1st, trims/nulls blank text, and rejects: inactive client, empty ratings, rating outside 1–5, or any service not actively assigned to that client.

## RLS

| table | anon | authenticated (admin) |
|---|---|---|
| `clients` | SELECT only where `is_active AND NOT hide_from_public_dropdown` | ALL |
| `services` | SELECT where `is_active` | ALL |
| `client_services` | SELECT where `is_active` | ALL |
| `feedback_submissions` | **none** (RPC only) | ALL |
| `feedback_ratings` | **none** (RPC only) | ALL |

Anon can never read or directly write feedback. Hidden clients cannot be enumerated
by a direct anon query — only reached through `get_portal_client` with the exact slug.

## Deviations from the original brief (deliberate, safer)

1. **No public INSERT policies on the feedback tables.** The brief listed
   `for insert with check (true)`; instead every write goes through `submit_feedback`,
   so unvalidated rows can't be inserted with the public anon key.
2. **Clients read policy adds `hide_from_public_dropdown = false`.** The brief's
   `using (is_active = true)` would have let anyone list every active client. The
   private-link pages use `get_portal_client(slug)` instead, which still serves
   hidden clients.
3. **Added `get_portal_client` and `get_feedback_for_edit` RPCs** — needed for the
   private-link render and the update-in-place flow without granting anon SELECT on
   feedback.
4. **Views set `security_invoker = true`** and revoked from anon (Postgres 15+ views
   otherwise run as owner and would leak feedback).
5. Minor: FK index on `client_services(service_id)`; dropped a redundant `slug` index.

## Regenerate types

```
npx supabase gen types typescript --project-id qdugohjjchvstfefynsy > supabase/types/database.types.ts
```
(or via the MCP `generate_typescript_types` tool)
