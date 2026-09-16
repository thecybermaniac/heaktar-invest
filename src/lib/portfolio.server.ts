import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const SERVICE_FEE_RATE = 0.02;

type DB = SupabaseClient<Database>;

export type PlanRow = {
  id: string;
  name: string;
  dailyInterest: number;
  term: number;
  minAmount: number;
  maxAmount: number;
  totalReturn: number;
  depositReturned: boolean;
  tagline: string;
};

export type InvestmentView = {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  fee: number;
  totalReturn: number;
  dailyReturn: number;
  startedAt: string;
  term: number;
  daysElapsed: number;
  status: "active" | "completed";
  earned: number;
};

export type ActivityView = {
  id: string;
  type: "deposit" | "withdrawal" | "investment" | "payout" | "referral";
  label: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
};

export type PortfolioSummary = {
  balance: number;
  netInvestment: number;
  netProfit: number;
  active: InvestmentView[];
  history: InvestmentView[];
  activities: ActivityView[];
  performance: { day: string; value: number }[];
  performanceChangePct: number;
};

const DAY_MS = 86_400_000;

type InvestmentRow = Database["public"]["Tables"]["investments"]["Row"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

type AccrualSummary = {
  amount: number;
  days: number;
};

function daysBetween(from: string | Date, to: Date) {
  const start = new Date(from).getTime();
  return Math.max(0, Math.floor((to.getTime() - start) / DAY_MS));
}

export async function listPlans(supabase: DB): Promise<PlanRow[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    dailyInterest: Number(p.daily_interest),
    term: p.term_days,
    minAmount: Number(p.min_amount),
    maxAmount: Number(p.max_amount),
    totalReturn: Number(p.total_return),
    depositReturned: p.deposit_returned,
    tagline: p.tagline,
  }));
}

function getAccrualsByInvestment(txs: TransactionRow[]) {
  const accruals = new Map<string, AccrualSummary>();
  const legacyPayouts = new Map<string, number>();

  for (const tx of txs) {
    if (tx.type !== "payout" || !tx.investment_id) continue;

    if (tx.reference?.startsWith("profit_")) {
      const current = accruals.get(tx.investment_id) ?? { amount: 0, days: 0 };
      accruals.set(tx.investment_id, {
        amount: current.amount + Number(tx.amount),
        days: current.days + 1,
      });
    } else if (tx.reference?.startsWith("payout_")) {
      legacyPayouts.set(tx.investment_id, Number(tx.amount));
    }
  }

  return { accruals, legacyPayouts };
}

function toInvestmentView(
  inv: InvestmentRow,
  now: Date,
  accruals: AccrualSummary | undefined,
  legacyPayout: number | undefined,
): InvestmentView {
  const amount = Number(inv.amount);
  const daily = Number(inv.daily_return);
  const elapsed = Math.min(daysBetween(inv.started_at, now), inv.term_days);
  const completed = inv.status === "completed";
  const earned = accruals?.amount ?? (legacyPayout === undefined ? 0 : Math.max(0, legacyPayout - amount));
  return {
    id: inv.id,
    planId: inv.plan_id,
    planName: inv.plan_name,
    amount,
    fee: Number(inv.fee),
    totalReturn: Number(inv.total_return),
    dailyReturn: daily,
    startedAt: new Date(inv.started_at).toISOString().slice(0, 10),
    term: inv.term_days,
    daysElapsed: completed ? inv.term_days : Math.min(accruals?.days ?? 0, elapsed),
    status: completed ? "completed" : "active",
    earned,
  };
}

const TX_LABEL_FALLBACK: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "New investment",
  payout: "Payout",
  referral: "Referral bonus",
};

export async function getPortfolio(supabase: DB, userId: string): Promise<PortfolioSummary> {
  const [{ data: invRows }, { data: txRows }] = await Promise.all([
    supabase
      .from("investments")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const now = new Date();
  const txs = txRows ?? [];
  const { accruals, legacyPayouts } = getAccrualsByInvestment(txs);
  const investments = (invRows ?? []).map((i) =>
    toInvestmentView(i, now, accruals.get(i.id), legacyPayouts.get(i.id)),
  );
  const active = investments.filter((i) => i.status === "active");
  const history = investments.filter((i) => i.status === "completed");

  // pending debits (withdrawals in flight) are held against the balance
  const counts = (status: string, amount: number) =>
    status === "completed" || (status === "pending" && amount < 0);
  const balance = txs
    .filter((t) => counts(t.status, Number(t.amount)))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netInvestment = active.reduce((s, i) => s + i.amount, 0);
  const netProfit = investments.reduce((s, i) => s + i.earned, 0);

  const activities: ActivityView[] = txs.slice(0, 20).map((t) => ({
    id: t.id,
    type: (t.type as ActivityView["type"]) ?? "deposit",
    label: t.label || TX_LABEL_FALLBACK[t.type] || "Transaction",
    amount: Number(t.amount),
    date: new Date(t.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: (t.status as ActivityView["status"]) ?? "completed",
  }));

  // 30-day equity curve: recorded cash plus principal still locked in active plans.
  // Daily profits are already in cash as dated payout transactions; nothing is projected here.
  const performance: { day: string; value: number }[] = [];
  for (let offset = 29; offset >= 0; offset--) {
    const at = new Date(now.getTime() - offset * DAY_MS);
    const cash = txs
      .filter((t) => counts(t.status, Number(t.amount)) && new Date(t.created_at) <= at)
      .reduce((s, t) => s + Number(t.amount), 0);

    const locked = (invRows ?? [])
      .filter((i) => {
        const started = new Date(i.started_at);
        const completedAt = i.completed_at ? new Date(i.completed_at) : null;
        return started <= at && (i.status === "active" || !completedAt || completedAt > at);
      })
      .reduce((s, i) => s + Number(i.amount), 0);

    performance.push({
      day: at.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round((cash + locked) * 100) / 100,
    });
  }

  const first = performance[0]?.value ?? 0;
  const last = performance[performance.length - 1]?.value ?? 0;
  const performanceChangePct = first > 0 ? ((last - first) / first) * 100 : 0;

  return {
    balance,
    netInvestment,
    netProfit,
    active,
    history,
    activities,
    performance,
    performanceChangePct: Math.round(performanceChangePct * 10) / 10,
  };
}

export async function createInvestment(
  supabase: DB,
  userId: string,
  input: { planId: string; amount: number },
) {
  const plans = await listPlans(supabase);
  const plan = plans.find((p) => p.id === input.planId);
  if (!plan) throw new Error("That plan is no longer available");

  const amount = Math.round(input.amount * 100) / 100;
  if (amount < plan.minAmount || amount > plan.maxAmount) {
    throw new Error(`Amount must be between ${plan.minAmount} and ${plan.maxAmount}`);
  }

  const fee = Math.round(amount * SERVICE_FEE_RATE * 100) / 100;
  const { balance } = await getPortfolio(supabase, userId);
  if (balance < amount + fee) throw new Error("Insufficient wallet balance for this investment");

  const dailyReturn = Math.round(((amount * plan.dailyInterest) / 100) * 100) / 100;

  const { data: inv, error } = await supabase
    .from("investments")
    .insert({
      user_id: userId,
      plan_id: plan.id,
      plan_name: plan.name,
      amount,
      fee,
      daily_return: dailyReturn,
      term_days: plan.term,
      total_return: plan.totalReturn,
      status: "active",
    })
    .select()
    .single();
  if (error || !inv) throw new Error(error?.message ?? "Could not start the investment");

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: userId,
    type: "investment",
    label: `New investment — ${plan.name}`,
    amount: -(amount + fee),
    status: "completed",
    investment_id: inv.id,
  });
  if (txError) {
    await supabase.from("investments").delete().eq("id", inv.id).eq("user_id", userId);
    throw new Error("Could not debit your wallet — investment cancelled");
  }

  return {
    id: inv.id,
    planId: plan.id,
    planName: plan.name,
    amount,
    fee,
    dailyReturn,
    term: plan.term,
    maturityPayout: amount + (amount * plan.totalReturn) / 100,
    reference: `HK-${inv.id.slice(0, 6).toUpperCase()}`,
  };
}

export async function creditDeposit(supabase: DB, userId: string, reference: string) {
  const { verifyTransaction } = await import("./paystack.server");
  const verified = await verifyTransaction(reference);
  if (!verified.success) return { success: false, amount: 0, reference };

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    type: "deposit",
    label: "Deposit — Paystack",
    amount: verified.amount,
    status: "completed",
    reference: verified.reference,
  });
  // unique reference means an already-credited deposit simply no-ops
  if (error && !error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);

  return { success: true, amount: verified.amount, reference: verified.reference };
}
