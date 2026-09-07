-- ============================================================
-- RohtreMedia Client Feedback Portal — core schema
-- Ships EMPTY: no seed data. Everything created via the admin UI.
-- ============================================================

-- CLIENTS -----------------------------------------------------
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
comment on table public.clients is 'Agency clients. Created only via admin UI. Never hard-delete a client with submissions.';
comment on column public.clients.hide_from_public_dropdown is 'When true, reachable only via private /f/[slug] link; never listed on the public dropdown.';

-- SERVICES (master list, reusable across clients) -------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table public.services is 'Master list of every service the agency offers. Created only via admin UI.';

-- WHICH SERVICES EACH CLIENT RECEIVES -----------------------
create table public.client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (client_id, service_id)
);
comment on table public.client_services is 'Assignment of services to a client. sort_order controls the order shown on the client form.';

-- ONE SUBMISSION PER CLIENT PER MONTH -----------------------
create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  period_month date not null,
  submitted_by_name text,
  submitted_by_email text,
  what_went_wrong text,
  what_can_we_improve text,
  overall_comment text,
  average_rating numeric(3,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, period_month),
  constraint period_month_is_first_of_month
    check (period_month = date_trunc('month', period_month)::date)
);
comment on column public.feedback_submissions.period_month is 'Always the 1st of the month, e.g. 2026-09-01.';
comment on column public.feedback_submissions.average_rating is 'Auto-maintained by trg_recalc_avg from feedback_ratings.';

-- INDIVIDUAL SERVICE RATINGS -------------------------------
create table public.feedback_ratings (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.feedback_submissions(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (submission_id, service_id)
);
comment on column public.feedback_ratings.service_id is 'ON DELETE RESTRICT: a service with ratings attached cannot be deleted.';

-- INDEXES --------------------------------------------------
create index idx_client_services_client on public.client_services(client_id);
create index idx_submissions_client_period on public.feedback_submissions(client_id, period_month desc);
create index idx_ratings_submission on public.feedback_ratings(submission_id);
create index idx_ratings_service on public.feedback_ratings(service_id);
create index idx_clients_slug on public.clients(slug);
