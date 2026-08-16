import { createServerFn } from "@tanstack/react-start";
import type { DepositMethod } from "./paystack.server";

export const initializeDeposit = createServerFn({ method: "POST" })
  .inputValidator((data: { amount: number; email: string; method: DepositMethod }) => {
    if (!data.email) throw new Error("Email is required");
    if (!data.amount || data.amount <= 0) throw new Error("Amount must be greater than zero");
    if (data.method !== "card" && data.method !== "bank_transfer") {
      throw new Error(`Unsupported payment method: ${data.method}`);
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { initializeTransaction } = await import("./paystack.server");
    return initializeTransaction(data);
  });

export const checkDepositStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { reference: string }) => {
    if (!data.reference) throw new Error("Reference is required");
    return data;
  })
  .handler(async ({ data }) => {
    const { verifyTransaction } = await import("./paystack.server");
    return verifyTransaction(data.reference);
  });
