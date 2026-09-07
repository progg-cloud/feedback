-- ============================================================
-- Public-facing RPCs (SECURITY DEFINER). These are the ONLY way
-- the anonymous client touches feedback data.
-- ============================================================

-- ------------------------------------------------------------
-- get_portal_client(slug): everything the /f/[slug] form needs.
-- Works for hidden clients too (that is the point of the private link),
-- but only while the client is active. Returns null if not found.
-- ------------------------------------------------------------
create or replace function public.get_portal_client(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',   c.id,
    'name', c.name,
    'slug', c.slug,
    'services', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'service_id',  sv.id,
                 'name',        sv.name,
                 'description', sv.description,
                 'sort_order',  cs.sort_order
               )
               order by cs.sort_order, sv.name
             )
      from public.client_services cs
      join public.services sv on sv.id = cs.service_id
      where cs.client_id = c.id
        and cs.is_active = true
        and sv.is_active = true
    ), '[]'::jsonb)
  )
  from public.clients c
  where c.slug = p_slug
    and c.is_active = true;
$$;

-- ------------------------------------------------------------
-- get_feedback_for_edit(client_id, period_month): existing submission
-- + ratings, so the form can offer "update it". Returns null if none.
-- ------------------------------------------------------------
create or replace function public.get_feedback_for_edit(
  p_client_id    uuid,
  p_period_month date
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'submission', jsonb_build_object(
      'id',                 s.id,
      'period_month',       s.period_month,
      'submitted_by_name',  s.submitted_by_name,
      'submitted_by_email', s.submitted_by_email,
      'what_went_wrong',    s.what_went_wrong,
      'what_can_we_improve',s.what_can_we_improve,
      'overall_comment',    s.overall_comment,
      'average_rating',     s.average_rating
    ),
    'ratings', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'service_id', r.service_id,
                 'rating',     r.rating,
                 'comment',    r.comment
               ) order by r.service_id
             )
      from public.feedback_ratings r
      where r.submission_id = s.id
    ), '[]'::jsonb)
  )
  from public.feedback_submissions s
  where s.client_id = p_client_id
    and s.period_month = date_trunc('month', p_period_month)::date;
$$;

-- ------------------------------------------------------------
-- submit_feedback(...): atomic upsert of a submission + all its
-- ratings in one transaction. On (client, month) conflict it
-- updates in place. Validates the client is active and every
-- rated service is actually assigned to that client.
-- ------------------------------------------------------------
create or replace function public.submit_feedback(
  p_client_id            uuid,
  p_period_month         date,
  p_submitted_by_name    text,
  p_submitted_by_email   text,
  p_what_went_wrong      text,
  p_what_can_we_improve  text,
  p_overall_comment      text,
  p_ratings              jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission_id uuid;
  v_period        date := date_trunc('month', p_period_month)::date;
  v_elem          jsonb;
  v_service_id    uuid;
  v_rating        int;
begin
  if not exists (
    select 1 from public.clients
    where id = p_client_id and is_active = true
  ) then
    raise exception 'Client not found or inactive' using errcode = 'P0002';
  end if;

  if p_ratings is null
     or jsonb_typeof(p_ratings) <> 'array'
     or jsonb_array_length(p_ratings) = 0 then
    raise exception 'At least one service rating is required' using errcode = '22023';
  end if;

  -- validate every rating references an active assigned service
  for v_elem in select * from jsonb_array_elements(p_ratings)
  loop
    v_service_id := (v_elem->>'service_id')::uuid;
    v_rating     := (v_elem->>'rating')::int;

    if v_service_id is null or v_rating is null then
      raise exception 'Each rating needs a service_id and a rating' using errcode = '22023';
    end if;
    if v_rating < 1 or v_rating > 5 then
      raise exception 'Rating must be between 1 and 5 (got %)', v_rating using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.client_services cs
      where cs.client_id = p_client_id
        and cs.service_id = v_service_id
        and cs.is_active = true
    ) then
      raise exception 'Service % is not assigned to this client', v_service_id using errcode = '22023';
    end if;
  end loop;

  -- upsert the submission
  insert into public.feedback_submissions (
    client_id, period_month, submitted_by_name, submitted_by_email,
    what_went_wrong, what_can_we_improve, overall_comment
  ) values (
    p_client_id, v_period,
    nullif(btrim(p_submitted_by_name), ''),
    nullif(btrim(p_submitted_by_email), ''),
    nullif(btrim(p_what_went_wrong), ''),
    nullif(btrim(p_what_can_we_improve), ''),
    nullif(btrim(p_overall_comment), '')
  )
  on conflict (client_id, period_month) do update
    set submitted_by_name   = excluded.submitted_by_name,
        submitted_by_email  = excluded.submitted_by_email,
        what_went_wrong     = excluded.what_went_wrong,
        what_can_we_improve = excluded.what_can_we_improve,
        overall_comment     = excluded.overall_comment,
        updated_at          = now()
  returning id into v_submission_id;

  -- replace ratings wholesale (clean update-in-place)
  delete from public.feedback_ratings where submission_id = v_submission_id;

  insert into public.feedback_ratings (submission_id, service_id, rating, comment)
  select v_submission_id,
         (e->>'service_id')::uuid,
         (e->>'rating')::int,
         nullif(btrim(e->>'comment'), '')
  from jsonb_array_elements(p_ratings) e;

  return v_submission_id;
end $$;

-- ---- GRANTS ------------------------------------------------
-- Lock down, then hand execute to the client roles explicitly.
revoke all on function public.get_portal_client(text)           from public;
revoke all on function public.get_feedback_for_edit(uuid, date)  from public;
revoke all on function public.submit_feedback(uuid, date, text, text, text, text, text, jsonb) from public;

grant execute on function public.get_portal_client(text)          to anon, authenticated;
grant execute on function public.get_feedback_for_edit(uuid, date) to anon, authenticated;
grant execute on function public.submit_feedback(uuid, date, text, text, text, text, text, jsonb) to anon, authenticated;
