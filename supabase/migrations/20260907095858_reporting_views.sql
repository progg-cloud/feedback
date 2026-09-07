-- ============================================================
-- Reporting views for the admin dashboard.
-- security_invoker = true  -> the caller's RLS applies, so anon
-- gets nothing and authenticated admins get everything.
-- ============================================================

create or replace view public.v_client_monthly
with (security_invoker = true) as
select
  c.id           as client_id,
  c.name         as client_name,
  s.period_month,
  s.average_rating,
  s.what_went_wrong,
  s.what_can_we_improve,
  s.overall_comment,
  s.created_at
from public.feedback_submissions s
join public.clients c on c.id = s.client_id
order by s.period_month desc;

create or replace view public.v_service_monthly
with (security_invoker = true) as
select
  c.id            as client_id,
  c.name          as client_name,
  sv.id           as service_id,
  sv.name         as service_name,
  s.period_month,
  r.rating,
  r.comment
from public.feedback_ratings r
join public.feedback_submissions s on s.id = r.submission_id
join public.clients c  on c.id = s.client_id
join public.services sv on sv.id = r.service_id
order by s.period_month desc, c.name, sv.name;

-- Belt-and-braces: keep anon off the reporting views entirely.
revoke all on public.v_client_monthly  from anon;
revoke all on public.v_service_monthly from anon;
grant select on public.v_client_monthly  to authenticated;
grant select on public.v_service_monthly to authenticated;
