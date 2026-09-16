import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getPortfolio } from "./portfolio.server";
import { namesLikelyMatch } from "./name-match";

type DB = SupabaseClient<Database>;

export type WithdrawalMethodView = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export async function getWithdrawalMethod(
  supabase: DB,
  userId: string,
): Promise<WithdrawalMethodView | null> {
  const { data, error } = await supabase
    .from("withdrawal_methods")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    bankCode: data.bank_code,
    bankName: data.bank_name,
    accountNumber: data.account_number,
    accountName: data.account_name,
  };
}

export async function saveWithdrawalMethod(
  supabase: DB,
  userId: string,
  input: WithdrawalMethodView,
) {
  // This check is the actual security control (we don't require reauth for withdrawals),
  // so it has to happen here, not just in the UI — anyone calling this function directly
  // must still go through it.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);

  const profileName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  if (!profileName) {
    throw new Error("Complete your profile name before adding a withdrawal method");
  }
  if (!namesLikelyMatch(profileName, input.accountName)) {
    throw new Error(
      "This account name doesn't match your profile name. Withdrawal accounts must belong to you.",
    );
  }

  // one method per user — user_id is UNIQUE, so this updates in place on re-save
  const { error } = await supabase.from("withdrawal_methods").upsert(
    {
      user_id: userId,
      bank_code: input.bankCode,
      bank_name: input.bankName,
      account_number: input.accountNumber,
      account_name: input.accountName,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function requestWithdrawal(supabase: DB, userId: string, input: { amount: number }) {
  const amount = Math.round(input.amount * 100) / 100;
  if (amount <= 0) throw new Error("Enter an amount to withdraw");

  const method = await getWithdrawalMethod(supabase, userId);
  if (!method) throw new Error("Add a withdrawal method before withdrawing");

  const { balance } = await getPortfolio(supabase, userId);
  if (amount > balance) throw new Error("Amount exceeds your available balance");

  // The pending transaction is what holds the funds: getPortfolio counts pending debits
  // against the balance, so this must land before the request row.
  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      type: "withdrawal",
      label: `Withdrawal — ${method.bankName} ••${method.accountNumber.slice(-4)}`,
      amount: -amount,
      status: "pending",
    })
    .select("id")
    .single();
  if (txError) throw new Error(txError.message);

  const { error: reqError } = await supabase.from("withdrawal_requests").insert({
    user_id: userId,
    transaction_id: tx.id,
    amount,
    bank_code: method.bankCode,
    bank_name: method.bankName,
    account_number: method.accountNumber,
    account_name: method.accountName,
  });
  if (reqError) {
    // Don't leave money held against a request that was never recorded.
    await supabase.from("transactions").delete().eq("id", tx.id);
    throw new Error(reqError.message);
  }

  return { amount, method };
}
