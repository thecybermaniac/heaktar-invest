import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listPlans } = await import("./portfolio.server");
    return listPlans(context.supabase);
  });

export const fetchPortfolio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getPortfolio } = await import("./portfolio.server");
    return getPortfolio(context.supabase, context.userId);
  });

export const startInvestment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { planId: string; amount: number }) => {
    if (!data.planId) throw new Error("Choose a plan first");
    if (!data.amount || data.amount <= 0) throw new Error("Enter an amount to invest");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { createInvestment } = await import("./portfolio.server");
    return createInvestment(context.supabase, context.userId, data);
  });

export const confirmDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { reference: string }) => {
    if (!data.reference) throw new Error("Reference is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { creditDeposit } = await import("./portfolio.server");
    return creditDeposit(context.supabase, context.userId, data.reference);
  });
