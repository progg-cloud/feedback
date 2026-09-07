# PROJECT: RohtreMedia Client Feedback Portal

Build a standalone web app where our agency clients rate the services we deliver to them each month, leave comments, and tell us what to improve. Results feed a private admin dashboard that tracks each client's satisfaction over time.

**Stack:** Next.js (App Router) + Tailwind CSS + Supabase (Postgres + Auth). Deploy to Vercel on `feedback.rohtremedia.com`.

---

## SECTION 1 — CORE PRINCIPLE: THE PORTAL SHIPS EMPTY

This is the most important design decision. **Do not seed any clients or services into the database.** The app launches with an empty client list and an empty service list.

Everything is created by us through the admin UI:
1. Admin logs in
2. Admin creates a client (e.g. "Neil Guides")
3. Admin creates the services we provide (e.g. "Video Editing", "Creative Direction")
4. Admin assigns the relevant services to that client
5. Only then does that client appear in the portal and become able to submit feedback

Every client receives a different mix of services. Pet Talks doesn't get Meta ads, Eco Top Woods doesn't get thumbnails. The form must render only the services actually assigned to the selected client.

We onboard and offboard clients constantly, and we add new service lines regularly. All of that must be doable from the UI, with no code changes and no redeploy. If I have to open a code file to add a client, the build is wrong.

---

## SECTION 2 — HOW WE'LL SHARE IT WITH CLIENTS

Build two ways in:

**A. Per-client private link (primary method)**
Each client gets their own URL based on their slug, e.g. `feedback.rohtremedia.com/f/neil-guides`. Opening it skips the dropdown entirely — the client's name is already locked in and their services render immediately. This is what we send to clients. It's cleaner, it prevents a client from accidentally selecting someone else's company, and it stops one client from seeing our full client list in a dropdown.

In the admin panel, every client row has a **Copy Link** button that copies their unique URL to the clipboard, ready to paste into WhatsApp or email.

**B. Generic link with dropdown (fallback)**
`feedback.rohtremedia.com` shows a dropdown of active clients. Useful internally, or if a client loses their link.

Add a setting per client: `hide_from_public_dropdown` (boolean). If enabled, that client is reachable only via their private link and never appears in the public dropdown. Default it to true so the client list stays private by default.

No login for clients. Sending them a password is friction that kills response rates.

---

## SECTION 3 — SUPABASE SCHEMA

```sql
-- CLIENTS
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  contact_email text,
  notes text,
  hide_from_public_dropdown boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- SERVICES (master list, reusable across clients)
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- WHICH SERVICES EACH CLIENT RECEIVES
create table public.client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (client_id, service_id)
);

-- ONE SUBMISSION PER CLIENT PER MONTH
create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  period_month date not null,               -- always the 1st, e.g. 2026-09-01
  submitted_by_name text,
  submitted_by_email text,
  what_went_wrong text,
  what_can_we_improve text,
  overall_comment text,
  average_rating numeric(3,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, period_month)
);

-- INDIVIDUAL SERVICE RATINGS
create table public.feedback_ratings (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.feedback_submissions(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (submission_id, service_id)
);

-- INDEXES
create index idx_client_services_client on public.client_services(client_id);
create index idx_submissions_client_period on public.feedback_submissions(client_id, period_month desc);
create index idx_ratings_submission on public.feedback_ratings(submission_id);
create index idx_ratings_service on public.feedback_ratings(service_id);

-- AUTO-CALCULATE AVERAGE RATING
create or replace function public.recalc_submission_average()
returns trigger language plpgsql as $$
begin
  update public.feedback_submissions s
  set average_rating = (
    select round(avg(r.rating)::numeric, 2)
    from public.feedback_ratings r
    where r.submission_id = coalesce(new.submission_id, old.submission_id)
  ),
  updated_at = now()
  where s.id = coalesce(new.submission_id, old.submission_id);
  return null;
end $$;

create trigger trg_recalc_avg
after insert or update or delete on public.feedback_ratings
for each row execute function public.recalc_submission_average();

-- REPORTING VIEW: monthly average per client
create or replace view public.v_client_monthly as
select
  c.id as client_id,
  c.name as client_name,
  s.period_month,
  s.average_rating,
  s.what_went_wrong,
  s.what_can_we_improve,
  s.overall_comment,
  s.created_at
from public.feedback_submissions s
join public.clients c on c.id = s.client_id
order by s.period_month desc;

-- REPORTING VIEW: rating per service per client per month
create or replace view public.v_service_monthly as
select
  c.id as client_id,
  c.name as client_name,
  sv.id as service_id,
  sv.name as service_name,
  s.period_month,
  r.rating,
  r.comment
from public.feedback_ratings r
join public.feedback_submissions s on s.id = r.submission_id
join public.clients c on c.id = s.client_id
join public.services sv on sv.id = r.service_id
order by s.period_month desc, c.name, sv.name;
```

**Row Level Security:**

```sql
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.client_services enable row level security;
alter table public.feedback_submissions enable row level security;
alter table public.feedback_ratings enable row level security;

-- Public reads active clients and mappings (needed to render the form)
create policy "public read clients"   on public.clients         for select using (is_active = true);
create policy "public read services"  on public.services        for select using (is_active = true);
create policy "public read mapping"   on public.client_services for select using (is_active = true);

-- Public can submit feedback but NEVER read any feedback
create policy "public insert submission" on public.feedback_submissions for insert with check (true);
create policy "public insert ratings"    on public.feedback_ratings     for insert with check (true);

-- Only authenticated admins read or manage anything else
create policy "admin all clients"      on public.clients              for all using (auth.role() = 'authenticated');
create policy "admin all services"     on public.services             for all using (auth.role() = 'authenticated');
create policy "admin all mapping"      on public.client_services      for all using (auth.role() = 'authenticated');
create policy "admin all submissions"  on public.feedback_submissions for all using (auth.role() = 'authenticated');
create policy "admin all ratings"      on public.feedback_ratings     for all using (auth.role() = 'authenticated');
```

**Atomic submission RPC** — write a `submit_feedback` Postgres function that takes the client id, period month, the text fields, and a JSON array of `{service_id, rating, comment}`, and inserts the submission plus all ratings in one transaction. On conflict with an existing client+month, update in place rather than failing. This prevents partial writes where a submission row exists with no ratings attached.

**Migration only, no seed.** Ship the schema empty.

---

## SECTION 4 — ADMIN PANEL (build this first)

Behind Supabase Auth, email + password, at `/admin`. Our team only.

**Clients management (`/admin/clients`)**
- Table of all clients: name, slug, number of services assigned, last submission date, current average rating, active toggle
- **Add Client** — name, contact email, optional notes. Slug auto-generates from the name, editable.
- Edit and deactivate. Deactivating hides them from the portal but keeps their historical feedback intact — never hard-delete a client with submissions.
- **Copy Link** button per row, copying their private feedback URL
- Toggle for `hide_from_public_dropdown`

**Services management (`/admin/services`)**
- Master list of every service we offer across the agency
- **Add Service** — name plus optional description shown as a tooltip on the form
- Edit and deactivate
- Show how many clients currently receive each service, and block deletion of a service that has ratings attached

**Assign services to a client (`/admin/clients/[id]`)**
- Two-panel interface: available services on the left, this client's assigned services on the right
- Add and remove with a click
- Drag to reorder, which sets `sort_order` and controls the order the client sees on their form
- This is the screen we'll use most, so make it fast and obvious

---

## SECTION 5 — CLIENT-FACING FORM

At `/f/[slug]` (private link) or `/` (dropdown).

1. **Client identification** — locked in from the slug, or selected from a custom-styled dropdown on the generic route. Show the client's name clearly at the top: "Feedback for Neil Guides."

2. **Dynamic service list** — load that client's active assigned services in `sort_order`. Each row:
   - Service name, with the description as a small tooltip if one exists
   - A 5-star rating control with clear hover and tap states and comfortable mobile tap targets
   - Optional note field collapsed behind a small "Add a note" link

3. **Month selector** — defaults to the current month, editable for late submissions.

4. **Two improvement boxes:**
   - "What didn't go well this month?"
   - "What can we improve?"
   Plus an optional general comment box.

5. **Identity fields** — name and email, both optional. Keep them optional on purpose: clients rate more honestly when their name isn't required.

6. **Submit** — validate every service has a rating, call the atomic RPC, show a clean thank-you state.

7. **Already submitted** — if a submission exists for that client and month, show "You've already submitted for this month. Would you like to update it?" with an Update button that loads existing ratings into the form for editing. Update in place.

8. **Empty state** — if a client has no services assigned yet, show a polite message rather than a broken empty form.

Fully responsive. Most clients will open this on a phone.

---

## SECTION 6 — ADMIN DASHBOARD (reporting)

**Overview (`/admin`)**
- Stat cards: submissions received this month, overall average across all clients, count of clients who haven't submitted yet this month
- Line chart of overall average month over month
- List of clients still pending this month, with their Copy Link buttons for chasing

**Per-client report (`/admin/clients/[id]/report`)**
- Line chart of that client's average rating over time
- Heatmap grid: services as rows, months as columns, each cell showing the rating, colour-coded — green 4–5, amber 3, red 1–2 — so a drop is instantly visible
- Every "what went wrong" and "what can we improve" entry listed chronologically with the month
- Per-service comments listed under each service

**Per-service report (`/admin/services/report`)**
- Average score per service across all clients, sorted worst first, so we can see where we're weakest as an agency
- Drill into any service to see which client rated it low and what they said

**Export**
- Any view downloadable as CSV

Use Recharts for all charts. Every chart and table must handle the empty state gracefully — on day one there is no data at all, and nothing should crash or render a broken axis.

---

## SECTION 7 — DESIGN DIRECTION

Match the visual language of our live WordPress site (screenshot attached). This must read as part of RohtreMedia, not a generic form.

**Colours**
- Primary red: approximately `#E8262C` — sample the exact value from the live site
- Near-black band: `#111111`
- White: `#FFFFFF`
- Light grey band: `#F4F4F4`
- Cream accent band: `#EDE7DA`
- Text on light: `#1A1A1A`; on dark: `#FFFFFF` with `#B0B0B0` for secondary

**Typography**
- Bold geometric sans-serif for headings — looks like Poppins, verify against the live site's CSS and match it
- Headings bold and tight; body text lighter with generous line height

**Signature patterns to reproduce**
- Small red uppercase eyebrow label above each section heading (like "SERVICE", "TESTIMONIALS" on the site)
- Short red horizontal divider centred beneath the heading
- Centred headings with centred supporting copy
- White cards with thin light borders and generous padding on light backgrounds
- Alternating light and dark section bands
- Red pill buttons, white text, subtle hover lift

**Layout**
- Header with the RohtreMedia logo top-left
- Dark hero band: "Tell us how we're doing" plus a line of supporting copy
- Form on a light background, centred, max-width around 800px
- Dark footer matching the site, with contact details

Copy the design system — colours, type scale, card style, eyebrow-and-divider heading pattern, button style. Don't copy the site's imagery or animations.

The admin panel can be a cleaner, denser variant of the same system — same colours and fonts, tighter spacing, more data on screen.

---

## SECTION 8 — DELIVERABLES

1. Full Next.js app, deployable to Vercel
2. Schema as a migration file — **no seed data**
3. The `submit_feedback` atomic RPC function
4. `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
5. Setup README: creating the Supabase project, running the migration, creating the first admin user, connecting the custom domain, and a short "how to add your first client" walkthrough
6. A design tokens file (Tailwind config or `theme.ts`) holding colours and type scale in one place

---

## BUILD ORDER

1. Supabase project, schema, RPC, RLS
2. Admin auth and the clients + services management screens — nothing else works until we can create a client
3. Public form with dynamic service loading and submission
4. Brand styling across both
5. Admin dashboard and charts
6. Deploy and connect the subdomain

Once it's running locally, the client reviews the frontend before deploy.
