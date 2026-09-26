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

// --- Theme -------------------------------------------------------------
// Split out of the old single AppState: toggling theme used to re-render every
// useApp() consumer app-wide (profile forms, investment flow, dashboard) even
// though none of them read theme. Now only components that call useTheme() do.

type ThemeState = { theme: "light" | "dark"; toggleTheme: () => void };

const ThemeCtx = createContext<ThemeState | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("heaktar-theme");
    if (stored === "dark") setTheme("dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("heaktar-theme", theme);
  }, [theme]);

  const value = useMemo<ThemeState>(
    () => ({ theme, toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }),
    [theme],
  );

  return createElement(ThemeCtx.Provider, { value }, children);
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within AppProvider");
  return ctx;
}

// --- Profile -------------------------------------------------------------

type ProfileState = { profile: Profile; setProfile: (p: Partial<Profile>) => void };

const ProfileCtx = createContext<ProfileState | null>(null);

function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);

  const setProfile = useCallback((p: Partial<Profile>) => {
    setProfileState((prev) => ({ ...(prev ?? DEFAULT_PROFILE), ...p }));
  }, []);

  const value = useMemo<ProfileState>(
    () => ({ profile, setProfile }),
    [profile, setProfile],
  );

  return createElement(ProfileCtx.Provider, { value }, children);
}

export function useProfileStore() {
  const ctx = useContext(ProfileCtx);
  if (!ctx) throw new Error("useProfileStore must be used within AppProvider");
  return ctx;
}

// --- Investment flow -------------------------------------------------------
// draft + lastInvestment stay together: the one place that needs both
// (invest.details.tsx) needs them together anyway, and grouping them still
// keeps this state out of the profile/theme re-render path and vice versa.

type InvestmentFlowState = {
  draft: Draft;
  setDraft: (d: Partial<Draft>) => void;
  lastInvestment: InvestmentConfirmation | null;
  setLastInvestment: (investment: InvestmentConfirmation | null) => void;
};

const InvestmentFlowCtx = createContext<InvestmentFlowState | null>(null);

function InvestmentFlowProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<Draft>({ planId: null, amount: 0 });
  const [lastInvestment, setLastInvestment] = useState<InvestmentConfirmation | null>(null);

  const value = useMemo<InvestmentFlowState>(
    () => ({
      draft,
      setDraft: (d) => setDraftState((prev) => ({ ...prev, ...d })),
      lastInvestment,
      setLastInvestment,
    }),
    [draft, lastInvestment],
  );

  return createElement(InvestmentFlowCtx.Provider, { value }, children);
}

export function useInvestmentFlow() {
  const ctx = useContext(InvestmentFlowCtx);
  if (!ctx) throw new Error("useInvestmentFlow must be used within AppProvider");
  return ctx;
}

// --- Combined provider -------------------------------------------------------
// Keeps the mount point in __root.tsx unchanged (still just <AppProvider>) while
// each piece of state lives in its own context under the hood.

export function AppProvider({ children }: { children: ReactNode }) {
  return createElement(
    ThemeProvider,
    null,
    createElement(ProfileProvider, null, createElement(InvestmentFlowProvider, null, children)),
  );
}
