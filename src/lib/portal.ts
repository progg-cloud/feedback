import { createClient } from "@/lib/supabase/server";

/** A service as rendered on the client feedback form. */
export type PortalService = {
  service_id: string;
  name: string;
  description: string | null;
  sort_order: number;
};

/** Payload returned by the get_portal_client RPC. */
export type PortalClient = {
  id: string;
  name: string;
  slug: string;
  services: PortalService[];
};

/** One service rating in an existing submission. */
export type ExistingRating = {
  service_id: string;
  rating: number;
  comment: string | null;
};

export type ExistingFeedback = {
  submission: {
    id: string;
    period_month: string;
    submitted_by_name: string | null;
    submitted_by_email: string | null;
    what_went_wrong: string | null;
    what_can_we_improve: string | null;
    overall_comment: string | null;
    average_rating: number | null;
  };
  ratings: ExistingRating[];
};

/** Fetch a client + its ordered active services for the /f/[slug] form. */
export async function getPortalClient(
  slug: string,
): Promise<PortalClient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_portal_client", {
    p_slug: slug,
  });
  if (error) throw error;
  return (data as PortalClient | null) ?? null;
}

/** Fetch an existing submission + ratings for a client/month, or null. */
export async function getExistingFeedback(
  clientId: string,
  periodMonth: string,
): Promise<ExistingFeedback | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_feedback_for_edit", {
    p_client_id: clientId,
    p_period_month: periodMonth,
  });
  if (error) throw error;
  const parsed = data as ExistingFeedback | null;
  // The RPC returns { submission: { id: null, ... } } shape only when a row
  // exists; a missing row yields SQL NULL -> null here.
  if (!parsed || !parsed.submission?.id) return null;
  return parsed;
}
