-- The recalc trigger function must never be a callable PostgREST RPC.
-- It runs only from trg_recalc_avg on feedback_ratings.
revoke all on function public.recalc_submission_average() from public, anon, authenticated;

comment on function public.recalc_submission_average() is
  'Trigger function for trg_recalc_avg only. Not part of the public API.';

-- Document that the three public RPCs are deliberately anon-executable.
comment on function public.submit_feedback(uuid, date, text, text, text, text, text, jsonb) is
  'PUBLIC API. Anonymous clients submit/update one month of feedback atomically. Validates client is active and every rated service is assigned to that client. SECURITY DEFINER with fixed search_path.';
comment on function public.get_portal_client(text) is
  'PUBLIC API. Returns a client + its ordered active services for the /f/[slug] form. Works for hidden clients via their private slug; active clients only.';
comment on function public.get_feedback_for_edit(uuid, date) is
  'PUBLIC API. Returns an existing submission + ratings for the "update it" flow. Returns null if none exists.';
