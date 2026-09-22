import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
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
  firstName: "",
  lastName: "",
  email: "",
  avatarUrl: "",
  referralCode: "",
  dob: "",
  gender: "",
  nationality: "",
  state: "",
  city: "",
  address: "",
  idType: "",
  idNumber: "",
  occupation: "",
  employmentStatus: "",
  sourceOfFunds: "",
  experience: "",
  riskTolerance: "",
};

export type InvestmentConfirmation = {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  fee: number;
  dailyReturn: number;
  term: number;
  maturityPayout: number;
  reference: string;
};

type Draft = { planId: string | null; amount: number };

type AppState = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;
  draft: Draft;
  setDraft: (d: Partial<Draft>) => void;
  lastInvestment: InvestmentConfirmation | null;
  setLastInvestment: (investment: InvestmentConfirmation | null) => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [draft, setDraftState] = useState<Draft>({ planId: null, amount: 0 });
  const [lastInvestment, setLastInvestment] = useState<InvestmentConfirmation | null>(null);

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
      setProfile: (p) => setProfileState((prev) => ({ ...prev ?? DEFAULT_PROFILE, ...p })),
      draft,
      setDraft: (d) => setDraftState((prev) => ({ ...prev, ...d })),
      lastInvestment,
      setLastInvestment,
    }),
    [theme, profile, draft, lastInvestment],
  );

  return createElement(Ctx.Provider, { value }, children);
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
