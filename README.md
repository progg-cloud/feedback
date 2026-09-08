# RohtreMedia — Client Feedback Portal

Clients rate the services we deliver each month, leave comments, and tell us what
to improve. Results feed a private admin dashboard.

**Stack:** Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Postgres + Auth) ·
Recharts. Deploy target: Vercel on `feedback.rohtremedia.com`.

The portal **ships empty** — no seeded clients or services. Everything is created
through the admin UI at `/admin`.

---

## 1. Local development

```bash
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run dev                     # http://localhost:3000
```

### Environment variables (`.env.local`)

| var | where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | same page → `service_role` `secret` key (server-only) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, `https://feedback.rohtremedia.com` in prod — used to build the per-client "Copy link" URLs |

The live project is **`rohtremedia-feedback`** (`qdugohjjchvstfefynsy`, region
`ap-southeast-1`). `.env.local` on this machine is already populated.

---

## 2. Database

Already provisioned. Schema lives in `supabase/migrations/` and is fully
documented in [`docs/DATABASE.md`](docs/DATABASE.md).

To reproduce it on a fresh Supabase project with the CLI:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Regenerate the TypeScript types after any schema change:

```bash
npx supabase gen types typescript --project-id <ref> > supabase/types/database.types.ts
```

---

## 3. Create the first admin user

Admins are ordinary Supabase Auth users (email + password). There is no public
sign-up — create them from the dashboard or with the helper script:

```bash
node scripts/create-admin.mjs you@rohtremedia.com 'a-strong-password'
```

(The script reads `.env.local` and uses the service-role key. Re-running it for an
existing email resets that user's password.)

Then sign in at `/login`.

> An admin already exists: **tfvgamingbusiness@gmail.com** — change its password
> with the script above before going live.

---

## 4. How to add your first client

1. Sign in at `/admin`.
2. **Services → + Add service** — add each service line the agency offers
   (e.g. "Video Editing", "Meta Ads"). Description is optional and shows as a
   tooltip on the client form.
3. **Clients → + Add client** — name, optional contact email/notes. The slug
   auto-fills from the name (editable). "Hide from public dropdown" defaults on.
4. Open the client → **drag services from the left panel to the right** to assign
   them. Drag the assigned list to set the order the client sees.
5. Back on **Clients**, hit **Copy link** on that row and paste it to the client
   over email / WhatsApp. It looks like
   `https://feedback.rohtremedia.com/f/neil-guides`.

Until a client has at least one service assigned, their form shows a polite
"not ready yet" message instead of an empty form.

---

## 5. Deploy to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. Add the four env vars from section 1 (set `NEXT_PUBLIC_SITE_URL` to
   `https://feedback.rohtremedia.com`).
3. Deploy.
4. **Custom domain:** Vercel project → Settings → Domains → add
   `feedback.rohtremedia.com`. Vercel shows a `CNAME` target — add it at the
   `rohtremedia.com` DNS host. SSL is issued automatically.
5. In Supabase → Authentication → URL Configuration, add
   `https://feedback.rohtremedia.com` to the allowed redirect/site URLs.

---

## Routes

| route | who | what |
|---|---|---|
| `/` | public | client dropdown (non-hidden clients) → their form |
| `/f/[slug]` | public | that client's feedback form (the link we send) |
| `/login` | admin | email + password sign in |
| `/admin` | admin | overview: stats, month-over-month trend, chasing list |
| `/admin/clients` | admin | client list, add/edit, active + hidden toggles, copy link |
| `/admin/clients/[id]` | admin | assign & reorder that client's services |
| `/admin/clients/[id]/report` | admin | trend, service×month heatmap, written feedback |
| `/admin/services` | admin | service master list, add/edit/deactivate/delete |
| `/admin/services/report` | admin | average per service across all clients, worst first |

---

## Project scripts

| script | purpose |
|---|---|
| `node scripts/create-admin.mjs <email> <pw>` | create / reset an admin user |
| `node scripts/smoke.mjs` | seed → test public flow end to end → clean up (dev server must be running) |
| `node scripts/smoke-admin.mjs <email> <pw>` | verify the authenticated-admin DB operations + RLS |
| `npm run seed:demo` | load the review demo data (see below) |
| `npm run seed:demo:clean` | remove all demo data |

---

## Demo / test data

`scripts/seed-demo.ts` populates the portal so every screen can be reviewed as
if it were live. It is **completely separate from the schema migration** — the
production database still ships empty.

```bash
npm run seed:demo         # populate
npm run seed:demo:clean   # remove
```

What it creates:

- One client, **`Test Client (Demo)`** (slug `test-client`, note "Demo data for
  internal review — delete before launch"), visible in the public dropdown
- Seven services (Meta Ads Support, Google Ads Support, Social Media Posting,
  Video Editing, Creative Direction, Lead Quality, Project Manager Support),
  all assigned to that client
- Six months of feedback: average climbs from ~3.6 → dips to ~2.7 → recovers to
  ~4.6, with Lead Quality consistently weak and Project Manager Support
  consistently strong, plus realistic written feedback and scattered
  per-service comments, and a mix of named / anonymous submitters

It only ever touches the `test-client` slug and those seven service names —
nothing else in the database. Re-running `seed:demo` is safe (it upserts).

> ### ⚠ Before launch
> Run **`npm run seed:demo:clean`** to wipe the demo client, its feedback, and
> any of the seven demo services not yet used by a real client. Confirm the
> Clients and Services screens are empty, then go live.

---

## Build status

| step | state |
|---|---|
| 1 · Supabase schema, RPC, RLS | ✅ done — see `docs/DATABASE.md` |
| 2 · Admin auth + clients/services management | ✅ done |
| 3 · Public form (dynamic services, submit, update-in-place, empty state) | ✅ done |
| 4 · Brand styling | 🟡 dark theme + Forum/Poppins type + patterns in place; still needs the real logo asset and a final check of the exact brand red |
| 5 · Admin dashboard + charts | ✅ overview, per-client report (trend + heatmap), service report, CSV export on every list/report view |
| 6 · Deploy + subdomain | ✅ live on Netlify at `feedback.rohtremedia.report` |
