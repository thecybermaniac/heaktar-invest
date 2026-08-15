import { createServerFn } from "@tanstack/react-start";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function paystackSecretKey() {
  const key = process.env["PAYSTACK_SECRET_KEY"];
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

const CHANNEL_MAP = {
  card: "card",
  bank_transfer: "bank_transfer",
} as const;

type DepositMethod = keyof typeof CHANNEL_MAP;

type InitializeTransactionResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type VerifyTransactionResponse = {
  status: boolean;
  message: string;
  data: {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number; // kobo
    currency: string;
    paid_at: string | null;
    customer: { email: string };
  };
};

export const initializeDeposit = createServerFn({ method: "POST" })
  .validator((data: { amount: number; email: string; method: DepositMethod }) => {
    if (!data.email) throw new Error("Email is required");
    if (!data.amount || data.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    if (!CHANNEL_MAP[data.method]) {
      throw new Error(`Unsupported payment method: ${data.method}`);
    }
    return data;
  })
  .handler(async ({ data }) => {
    const reference = `htk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        amount: Math.round(data.amount * 100), // naira -> kobo
        reference,
        currency: "NGN",
        channels: [CHANNEL_MAP[data.method]],
        callback_url: `${process.env["APP_URL"]}/deposit/callback`,
        metadata: { purpose: "wallet_deposit" },
      }),
    });

    const json = (await res.json()) as InitializeTransactionResponse;

    if (!res.ok || !json.status) {
      throw new Error(json.message || "Could not initialize transaction");
    }

    return {
      authorizationUrl: json.data.authorization_url,
      reference: json.data.reference,
    };
  });

export const checkDepositStatus = createServerFn({ method: "GET" })
  .validator((data: { reference: string }) => {
    if (!data.reference) throw new Error("Reference is required");
    return data;
  })
  .handler(async ({ data }) => {
    const res = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${paystackSecretKey()}` } },
    );
    const json = (await res.json()) as VerifyTransactionResponse;
    if (!res.ok || !json.status) throw new Error(json.message || "Could not verify transaction");

    return {
      success: json.data.status === "success",
      reference: json.data.reference,
      amount: json.data.amount / 100,
    };
  });
