import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApp, type Profile } from "@/lib/app-store";
import { profileQueryOptions } from "@/hooks/use-profile";
import { PROFILE_COLUMNS } from "@/lib/profile-columns";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean;
  refreshProfile: () => Promise<void>;
  saveProfile: (patch: Partial<Profile> & { onboardingCompleted?: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setProfile } = useApp();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // fetchQuery shares the exact cache entry _authenticated's beforeLoad and the dashboard
  // loader warm (see hooks/use-profile.ts) — usually already resolved by the time this
  // runs, instead of firing a second, uncached round trip straight to Supabase.
  const loadProfile = useCallback(async () => {
    const { onboardingCompleted: onboarded, ...patch } = await queryClient.fetchQuery(profileQueryOptions());
    setProfile(patch);
    setOnboardingCompleted(onboarded);
  }, [queryClient, setProfile]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) {
        setTimeout(() => void loadProfile(), 0);
      } else {
        setOnboardingCompleted(false);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void loadProfile();
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    await loadProfile();
  }, [session, queryClient, loadProfile]);

  const saveProfile = useCallback(
    async (patch: Partial<Profile> & { onboardingCompleted?: boolean }) => {
      if (!session?.user) return;
      const row: Record<string, unknown> = { id: session.user.id };
      (Object.keys(PROFILE_COLUMNS) as (keyof Profile)[]).forEach((key) => {
        const value = patch[key];
        if (typeof value === "string") row[PROFILE_COLUMNS[key]] = value;
      });
      if (patch.onboardingCompleted !== undefined) {
        row["onboarding_completed"] = patch.onboardingCompleted;
        setOnboardingCompleted(patch.onboardingCompleted);
      }
      const { error } = await supabase.from("profiles").upsert(row as never, { onConflict: "id" });
      if (error) throw error;
      setProfile(patch);
      // Without this, the "profile" query cache (shared with _authenticated's beforeLoad —
      // see route.tsx) can still hand back the pre-save onboardingCompleted for up to its
      // staleTime, which is exactly the stale-read bounce route.tsx's comment warns about.
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    [session, setProfile, queryClient],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setOnboardingCompleted(false);
    // None of the query keys here (profile, portfolio, notifications, ...) are scoped by
    // user id, so without this, a different user signing in on the same tab shortly after
    // could briefly see the previous user's cached data — profile included, now that it's
    // cached client-side too. Clearing the whole cache on sign-out is the safe reset.
    queryClient.clear();
    // the _authenticated route also caches its own auth/onboarding check for 30s (route.tsx);
    // this forces that to re-run rather than wait it out.
    await router.invalidate();
  }, [router, queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      onboardingCompleted,
      refreshProfile,
      saveProfile,
      signOut,
    }),
    [session, loading, onboardingCompleted, refreshProfile, saveProfile, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
