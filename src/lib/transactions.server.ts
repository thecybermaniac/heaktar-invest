import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getPortfolio } from "./portfolio.server";

type DB = SupabaseClient<Database>;

export type TransactionRowView = {
  id: string;
  type: string;
  label: string;
  amount: number;
  status: string;
  date: string;
};

const TX_LABEL_FALLBACK: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "New investment",
  payout: "Payout",
  referral: "Referral bonus",
};

const PAGE_SIZE = 30;

function toView(t: {
  id: string;
  type: string;
  label: string | null;
  amount: number;
  status: string;
  created_at: string;
}): TransactionRowView {
  return {
    id: t.id,
    type: t.type,
    label: t.label || TX_LABEL_FALLBACK[t.type] || "Transaction",
    amount: Number(t.amount),
    status: t.status,
    date: t.created_at,
  };
}

export async function listTransactionsPage(
  supabase: DB,
  userId: string,
  input: { type?: string; page: number },
): Promise<{ rows: TransactionRowView[]; hasMore: boolean }> {
  const page = Math.max(0, input.page);
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE); // fetch one extra to detect hasMore

  if (input.type && input.type !== "all") {
    query = query.eq("type", input.type);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  return { rows: rows.slice(0, PAGE_SIZE).map(toView), hasMore };
}

export async function listTransactionsInRange(
  supabase: DB,
  userId: string,
  input: { from: string; to: string },
): Promise<TransactionRowView[]> {
  // `to` is a date (YYYY-MM-DD); include the whole day by bounding at the next day.
  const toExclusive = new Date(input.to);
  toExclusive.setDate(toExclusive.getDate() + 1);

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", new Date(input.from).toISOString())
    .lt("created_at", toExclusive.toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map(toView);
}

export async function getAccountCreatedAt(supabase: DB, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  // Falls back to now if somehow missing, so the picker still opens rather than breaking —
  // in practice this row always exists once handle_new_user() has run at signup.
  return data?.created_at ?? new Date().toISOString();
}

export type StatementHeaderInfo = {
  customerName: string;
  balance: number;
};

export async function getStatementHeaderInfo(
  supabase: DB,
  userId: string,
): Promise<StatementHeaderInfo> {
  const [{ data: profileRow, error: profileError }, portfolio] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name").eq("id", userId).maybeSingle(),
    getPortfolio(supabase, userId),
  ]);
  if (profileError) throw new Error(profileError.message);

  const customerName = [profileRow?.first_name, profileRow?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return { customerName: customerName || "Heaktar customer", balance: portfolio.balance };
}
