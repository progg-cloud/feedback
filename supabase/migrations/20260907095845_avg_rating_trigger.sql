-- ============================================================
-- Auto-calculate feedback_submissions.average_rating
-- ============================================================
create or replace function public.recalc_submission_average()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
