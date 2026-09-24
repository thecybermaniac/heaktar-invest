import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Profile } from "@/lib/app-store";
import { PROFILE_COLUMNS } from "@/lib/profile-columns";

type DB = SupabaseClient<Database>;

export type ProfileView = Partial<Profile> & { onboardingCompleted: boolean };

export async function getProfile(supabase: DB, userId: string): Promise<ProfileView> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);

  const patch: Partial<Profile> = {};
  if (data) {
    (Object.keys(PROFILE_COLUMNS) as (keyof Profile)[]).forEach((key) => {
      const value = (data as Record<string, unknown>)[PROFILE_COLUMNS[key]];
      if (typeof value === "string" && value.length > 0) patch[key] = value;
    });
  }

  return { ...patch, onboardingCompleted: Boolean(data?.onboarding_completed) };
}
