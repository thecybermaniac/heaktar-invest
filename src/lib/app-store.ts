import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  referralCode: string;
  dob: string;
  gender: string;
  nationality: string;
  state: string;
  city: string;
  address: string;
  idType: string;
  idNumber: string;
  occupation: string;
  employmentStatus: string;
  sourceOfFunds: string;
  experience: string;
  riskTolerance: string;
};

export const DEFAULT_PROFILE: Profile = {
  firstName: "Adaeze",
  lastName: "Heaktar",
  email: "adaeze@heaktar.app",
  referralCode: "HEAK-8241",
  dob: "1994-06-12",
  gender: "Female",
  nationality: "Nigeria",
  state: "Lagos",
  city: "Ikeja",
  address: "14 Allen Avenue, Ikeja",
  idType: "National ID",
  idNumber: "NIN-2938-4471",
  occupation: "Product Designer",
  employmentStatus: "Employed",
  sourceOfFunds: "Salary",
  experience: "Intermediate",
  riskTolerance: "Balanced",
};

type Draft = { planId: string | null; amount: number };

type AppState = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;
  draft: Draft;
  setDraft: (d: Partial<Draft>) => void;
  unread: number;
  markAllRead: () => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [draft, setDraftState] = useState<Draft>({ planId: null, amount: 0 });
  const [unread, setUnread] = useState(3);

  useEffect(() => {
    const stored = window.localStorage.getItem("heaktar-theme");
    if (stored === "dark") setTheme("dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("heaktar-theme", theme);
  }, [theme]);

  const value = useMemo<AppState>(
    () => ({
      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      profile,
      setProfile: (p) => setProfileState((prev) => ({ ...prev, ...p })),
      draft,
      setDraft: (d) => setDraftState((prev) => ({ ...prev, ...d })),
      unread,
      markAllRead: () => setUnread(0),
    }),
    [theme, profile, draft, unread],
  );

  return createElement(Ctx.Provider, { value }, children);
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
