"use server";

import { createClient } from "@/lib/supabase/server";
import { monthInputToPeriod } from "@/lib/month";

export type SubmitResult =
  | { ok: true; submissionId: string }
  | { ok: false; error: string };

type RatingInput = { service_id: string; rating: number; comment?: string | null };

export async function submitFeedbackAction(payload: {
  clientId: string;
  monthInput: string; // "YYYY-MM"
  submittedByName?: string;
  submittedByEmail?: string;
  whatWentWrong?: string;
  whatCanWeImprove?: string;
  overallComment?: string;
  ratings: RatingInput[];
}): Promise<SubmitResult> {
  const supabase = await createClient();

  if (!payload.clientId) return { ok: false, error: "Missing client." };
  if (!payload.monthInput) return { ok: false, error: "Pick a month." };
  if (!payload.ratings.length) {
    return { ok: false, error: "Rate each service before submitting." };
  }
  for (const r of payload.ratings) {
    if (!r.rating || r.rating < 1 || r.rating > 5) {
      return { ok: false, error: "Every service needs a star rating." };
    }
  }

  const { data, error } = await supabase.rpc("submit_feedback", {
    p_client_id: payload.clientId,
    p_period_month: monthInputToPeriod(payload.monthInput),
    p_submitted_by_name: payload.submittedByName?.trim() || "",
    p_submitted_by_email: payload.submittedByEmail?.trim() || "",
    p_what_went_wrong: payload.whatWentWrong?.trim() || "",
    p_what_can_we_improve: payload.whatCanWeImprove?.trim() || "",
    p_overall_comment: payload.overallComment?.trim() || "",
    p_ratings: payload.ratings.map((r) => ({
      service_id: r.service_id,
      rating: r.rating,
      comment: r.comment?.trim() || null,
    })),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, submissionId: data as string };
}
