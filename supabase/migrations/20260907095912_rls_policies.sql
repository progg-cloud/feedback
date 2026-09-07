-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.clients              enable row level security;
alter table public.services             enable row level security;
alter table public.client_services      enable row level security;
alter table public.feedback_submissions enable row level security;
alter table public.feedback_ratings     enable row level security;

-- ---- PUBLIC (anon) READ -----------------------------------
-- Clients: only ACTIVE and NOT hidden are exposed to anon (the public dropdown).
-- Hidden-but-active clients are reachable only through the get_portal_client()
-- RPC via their private slug — a direct anon query cannot enumerate them.
create policy "public read listed clients"
  on public.clients for select to anon
  using (is_active = true and hide_from_public_dropdown = false);

create policy "public read services"
  on public.services for select to anon
  using (is_active = true);

create policy "public read mapping"
  on public.client_services for select to anon
  using (is_active = true);

-- ---- PUBLIC WRITE ---------------------------------------
-- Deliberately NONE. All feedback writes go through the SECURITY DEFINER
-- submit_feedback() RPC, which validates the client + assigned services.
-- anon can neither read nor directly insert feedback rows.

-- ---- ADMIN (authenticated) FULL ACCESS ------------------
create policy "admin all clients"
  on public.clients for all to authenticated
  using (true) with check (true);

create policy "admin all services"
  on public.services for all to authenticated
  using (true) with check (true);

create policy "admin all mapping"
  on public.client_services for all to authenticated
  using (true) with check (true);

create policy "admin all submissions"
  on public.feedback_submissions for all to authenticated
  using (true) with check (true);

create policy "admin all ratings"
  on public.feedback_ratings for all to authenticated
  using (true) with check (true);
