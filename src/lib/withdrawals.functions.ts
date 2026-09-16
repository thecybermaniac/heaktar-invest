import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchWithdrawalMethod = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getWithdrawalMethod } = await import("./withdrawals.server");
    return getWithdrawalMethod(context.supabase, context.userId);
  });

export const saveWithdrawalMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { bankCode: string; bankName: string; accountNumber: string; accountName: string }) => {
      if (!data.bankCode || !data.bankName) throw new Error("Select a bank");
      if (!/^\d{10}$/.test(data.accountNumber)) throw new Error("Enter a valid 10-digit account number");
      if (!data.accountName) throw new Error("Account name could not be verified");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { saveWithdrawalMethod: save } = await import("./withdrawals.server");
    return save(context.supabase, context.userId, data);
  });

export const submitWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { amount: number }) => {
    if (!data.amount || data.amount <= 0) throw new Error("Enter an amount to withdraw");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { requestWithdrawal } = await import("./withdrawals.server");
    return requestWithdrawal(context.supabase, context.userId, data);
  });
