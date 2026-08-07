import { supabase } from "../supabase/client";
import type { ActivityLog, ActivityLogInput } from "../../types/activity";

export async function logActivity(userId: string, input: ActivityLogInput) {
  const { error } = await supabase
    .from("activity_logs")
    .insert({ user_id: userId, action: input.action, details: input.details ?? null });
  if (error) return;
}

export async function listActivities(limit = 100) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id,user_id,action,details,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ActivityLog[];
}
