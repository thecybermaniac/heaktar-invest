import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchTransactionsPage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { type?: string; page: number }) => data)
  .handler(async ({ data, context }) => {
    const { listTransactionsPage } = await import("./transactions.server");
    return listTransactionsPage(context.supabase, context.userId, data);
  });

export const fetchStatementTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { from: string; to: string }) => {
    if (!data.from || !data.to) throw new Error("Select a date range");
    if (data.from > data.to) throw new Error("Start date must be before the end date");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { listTransactionsInRange } = await import("./transactions.server");
    return listTransactionsInRange(context.supabase, context.userId, data);
  });
