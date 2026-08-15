import { supabase } from "@/integrations/supabase/client";

/** Reads the signed-in user's onboarding state. Returns false when unknown. */
export async function isOnboarded(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.onboarding_completed);
}

/** Where a freshly authenticated user should land. */
export async function landingRouteFor(userId: string): Promise<"/dashboard" | "/onboarding"> {
  return (await isOnboarded(userId)) ? "/dashboard" : "/onboarding";
}
