import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;

export type NotificationView = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  kind: "payout" | "security" | "system" | "referral";
};

const KIND_BY_TYPE: Record<string, NotificationView["kind"]> = {
  payout: "payout",
  referral: "referral",
  deposit: "system",
  withdrawal: "system",
  investment: "system",
  security: "security",
};

function formatTime(createdAt: string) {
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function listNotifications(supabase: DB, userId: string): Promise<NotificationView[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    time: formatTime(n.created_at),
    read: n.read_at !== null,
    kind: KIND_BY_TYPE[n.type] ?? "system",
  }));
}

export async function markNotificationRead(supabase: DB, userId: string, id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(supabase: DB, userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw new Error(error.message);
}
