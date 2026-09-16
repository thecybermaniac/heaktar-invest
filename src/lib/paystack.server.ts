const PAYSTACK_BASE_URL = "https://api.paystack.co";

export const CHANNEL_MAP = {
  card: "card",
  bank_transfer: "bank_transfer",
} as const;

export type DepositMethod = keyof typeof CHANNEL_MAP;

function paystackSecretKey() {
  const key = process.env["PAYSTACK_SECRET_KEY"];
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

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

export async function initializeTransaction(input: {
  amount: number;
  email: string;
  method: DepositMethod;
}) {
  const reference = `htk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const appUrl = process.env["APP_URL"] ?? "";

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100), // naira -> kobo
      reference,
      currency: "NGN",
      channels: [CHANNEL_MAP[input.method]],
      callback_url: `${appUrl}/deposit/callback`,
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
}

export async function verifyTransaction(reference: string) {  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${paystackSecretKey()}` } },
  );
  const json = (await res.json()) as VerifyTransactionResponse;
  if (!res.ok || !json.status) throw new Error(json.message || "Could not verify transaction");

  return {
    success: json.data.status === "success",
    reference: json.data.reference,
    amount: json.data.amount / 100,
  };
}

type ListBanksResponse = {
  status: boolean;
  message: string;
  data: Array<{
    name: string;
    slug: string;
    code: string;
    active: boolean;
    currency: string;
    type: string;
  }>;
};

type ResolveAccountResponse = {
  status: boolean;
  message: string;
  data: { account_number: string; account_name: string };
};

export type Bank = { code: string; name: string };

export async function listBanks(): Promise<Bank[]> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/bank?currency=NGN&perPage=100`, {
    headers: { Authorization: `Bearer ${paystackSecretKey()}` },
  });
  const json = (await res.json()) as ListBanksResponse;
  if (!res.ok || !json.status) throw new Error(json.message || "Could not load banks");

  const seen = new Set<string>();
  return json.data
    .filter((b) => b.active && b.currency === "NGN")
    // Paystack returns some banks under multiple entries (e.g. differing gateways);
    // de-dupe on code so the picker doesn't show the same bank twice.
    .filter((b) => (seen.has(b.code) ? false : (seen.add(b.code), true)))
    .map((b) => ({ code: b.code, name: b.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function resolveAccount(input: { accountNumber: string; bankCode: string }) {
  const params = new URLSearchParams({
    account_number: input.accountNumber,
    bank_code: input.bankCode,
  });
  const res = await fetch(`${PAYSTACK_BASE_URL}/bank/resolve?${params}`, {
    headers: { Authorization: `Bearer ${paystackSecretKey()}` },
  });
  const json = (await res.json()) as ResolveAccountResponse;
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Could not verify that account number");
  }
  return { accountNumber: json.data.account_number, accountName: json.data.account_name };
}
