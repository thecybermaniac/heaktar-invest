export type Plan = {
  id: string;
  name: string;
  dailyInterest: number;
  term: number;
  minAmount: number;
  maxAmount: number;
  depositReturned: boolean;
  totalReturn: number;
  tagline: string;
};


export const SERVICE_FEE_RATE = 0.02;

export type Investment = {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  dailyReturn: number;
  startedAt: string;
  term: number;
  daysElapsed: number;
  status: "active" | "completed";
  earned: number;
}

export type Activity = {
  id: string;
  type: "deposit" | "withdrawal" | "investment" | "payout" | "referral";
  label: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  kind: "payout" | "security" | "system" | "referral";
};


export const PAYMENT_METHODS = [
  { id: "bank_transfer", label: "Bank transfer", hint: "Takes a few minutes" },
  { id: "card", label: "Debit card", hint: "Credited instantly" },
];

export const HOST_NAME = import.meta.HOST_NANE

export const fmt = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const money = (n: number, digits = 2) => `₦${fmt(Math.abs(n), digits)}`;
