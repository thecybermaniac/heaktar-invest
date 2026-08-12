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
import { supabase } from "@/integrations/supabase/client";
import { useApp, type Profile } from "@/lib/app-store";

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

const COLUMNS = {
  firstName: "first_name",
  lastName: "last_name",
  email: "email",
  referralCode: "referral_code",
  dob: "dob",
  gender: "gender",
  nationality: "nationality",
  state: "state",
  city: "city",
  address: "address",
  idType: "id_type",
  idNumber: "id_number",
  occupation: "occupation",
  employmentStatus: "employment_status",
  sourceOfFunds: "source_of_funds",
  experience: "experience",
  riskTolerance: "risk_tolerance",
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setProfile } = useApp();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (!data) return;
      const patch: Partial<Profile> = {};
      (Object.keys(COLUMNS) as (keyof typeof COLUMNS)[]).forEach((key) => {
        const value = (data as Record<string, unknown>)[COLUMNS[key]];
        if (typeof value === "string" && value.length > 0) patch[key] = value;
      });
      setProfile(patch);
      setOnboardingCompleted(Boolean(data.onboarding_completed));
    },
    [setProfile],
  );

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) {
        setTimeout(() => void loadProfile(next.user.id), 0);
      } else {
        setOnboardingCompleted(false);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void loadProfile(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const saveProfile = useCallback(
    async (patch: Partial<Profile> & { onboardingCompleted?: boolean }) => {
      if (!session?.user) return;
      const row: Record<string, unknown> = { id: session.user.id };
      (Object.keys(COLUMNS) as (keyof typeof COLUMNS)[]).forEach((key) => {
        const value = patch[key];
        if (typeof value === "string") row[COLUMNS[key]] = value;
      });
      if (patch.onboardingCompleted !== undefined) {
        row["onboarding_completed"] = patch.onboardingCompleted;
        setOnboardingCompleted(patch.onboardingCompleted);
      }
      const { error } = await supabase.from("profiles").upsert(row as never, { onConflict: "id" });
      if (error) throw error;
      setProfile(patch);
    },
    [session, setProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

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
