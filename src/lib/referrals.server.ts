import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;

export type ReferralView = {
  id: string;
  name: string;
  joined: string;
  earned: number;
  status: "active" | "pending";
};

export type ReferralSummary = {
  referralCode: string;
  count: number;
  totalEarned: number;
  referrals: ReferralView[];
};

function formatJoined(joinedAt: string) {
  return new Date(joinedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export async function getReferralSummary(supabase: DB, userId: string): Promise<ReferralSummary> {
  const [{ data: profile, error: profileError }, { data: rows, error: listError }] = await Promise.all([
    supabase.from("profiles").select("referral_code").eq("id", userId).maybeSingle(),
    supabase.rpc("list_my_referrals"),
  ]);
  if (profileError) throw new Error(profileError.message);
  if (listError) throw new Error(listError.message);

  const referrals: ReferralView[] = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name || "Heaktar user",
    joined: formatJoined(r.joined_at),
    earned: Number(r.earned),
    status: Number(r.earned) > 0 ? "active" : "pending",
  }));

  return {
    referralCode: profile?.referral_code ?? "",
    count: referrals.length,
    totalEarned: referrals.reduce((sum, r) => sum + r.earned, 0),
    referrals,
  };
}
