import { supabase } from "../supabase/client";
import type { Review, ReviewInput } from "../../types/review";

const REVIEW_SELECT = `id,company_id,reviewer_id,rating,comment,created_at,
reviewer:companies(id,company_name,trade_name,logo_url)`;

export async function listReviews(companyId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Review[];
}

export async function createReview(reviewerId: string, input: ReviewInput) {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      company_id: input.company_id,
      reviewer_id: reviewerId,
      rating: input.rating,
      comment: input.comment ?? null,
    })
    .select(REVIEW_SELECT)
    .single();

  if (error) throw error;

  await refreshCompanyRating(input.company_id);
  return data as unknown as Review;
}

export async function refreshCompanyRating(companyId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("company_id", companyId);

  if (error) return;

  const ratings = (data ?? []).map((r) => Number(r.rating));
  const average =
    ratings.length > 0
      ? ratings.reduce((acc, r) => acc + r, 0) / ratings.length
      : 0;

  await supabase
    .from("companies")
    .update({
      rating: Number(average.toFixed(2)),
      review_count: ratings.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);
}
