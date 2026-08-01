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

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    dailyInterest: 1.2,
    term: 15,
    minAmount: 50,
    maxAmount: 999,
    depositReturned: true,
    totalReturn: 18,
    tagline: "Dip your toes in with a short, low-commitment cycle.",
  },
  {
    id: "silver",
    name: "Silver",
    dailyInterest: 1.6,
    term: 30,
    minAmount: 1000,
    maxAmount: 4999,
    depositReturned: true,
    totalReturn: 48,
    tagline: "Balanced monthly yield for steady portfolio growth.",
  },
  {
    id: "diamond",
    name: "Diamond",
    dailyInterest: 2.1,
    term: 45,
    minAmount: 5000,
    maxAmount: 19999,
    depositReturned: true,
    totalReturn: 94.5,
    tagline: "Higher daily payouts for committed investors.",
  },
  {
    id: "platinum",
    name: "Platinum",
    dailyInterest: 2.8,
    term: 60,
    minAmount: 20000,
    maxAmount: 100000,
    depositReturned: true,
    totalReturn: 168,
    tagline: "Our flagship tier with priority desk support.",
  },
];

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
};

export const ACTIVE_INVESTMENTS: Investment[] = [
  {
    id: "inv-1",
    planId: "diamond",
    planName: "Diamond",
    amount: 7500,
    dailyReturn: 157.5,
    startedAt: "2026-07-14",
    term: 45,
    daysElapsed: 18,
    status: "active",
    earned: 2835,
  },
  {
    id: "inv-2",
    planId: "silver",
    planName: "Silver",
    amount: 2400,
    dailyReturn: 38.4,
    startedAt: "2026-07-22",
    term: 30,
    daysElapsed: 10,
    status: "active",
    earned: 384,
  },
  {
    id: "inv-3",
    planId: "starter",
    planName: "Starter",
    amount: 600,
    dailyReturn: 7.2,
    startedAt: "2026-07-28",
    term: 15,
    daysElapsed: 4,
    status: "active",
    earned: 28.8,
  },
];

export const PAST_INVESTMENTS: Investment[] = [
  {
    id: "inv-p1",
    planId: "platinum",
    planName: "Platinum",
    amount: 22000,
    dailyReturn: 616,
    startedAt: "2026-04-02",
    term: 60,
    daysElapsed: 60,
    status: "completed",
    earned: 36960,
  },
  {
    id: "inv-p2",
    planId: "silver",
    planName: "Silver",
    amount: 1800,
    dailyReturn: 28.8,
    startedAt: "2026-05-11",
    term: 30,
    daysElapsed: 30,
    status: "completed",
    earned: 864,
  },
  {
    id: "inv-p3",
    planId: "starter",
    planName: "Starter",
    amount: 350,
    dailyReturn: 4.2,
    startedAt: "2026-06-19",
    term: 15,
    daysElapsed: 15,
    status: "completed",
    earned: 63,
  },
  {
    id: "inv-p4",
    planId: "diamond",
    planName: "Diamond",
    amount: 9000,
    dailyReturn: 189,
    startedAt: "2026-03-05",
    term: 45,
    daysElapsed: 45,
    status: "completed",
    earned: 8505,
  },
];

export type Activity = {
  id: string;
  type: "deposit" | "withdrawal" | "investment" | "payout" | "referral";
  label: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
};

export const ACTIVITIES: Activity[] = [
  { id: "a1", type: "payout", label: "Daily payout — Diamond", amount: 157.5, date: "Aug 1, 09:02", status: "completed" },
  { id: "a2", type: "deposit", label: "Deposit — Bank transfer", amount: 2500, date: "Jul 31, 17:41", status: "completed" },
  { id: "a3", type: "investment", label: "New investment — Silver", amount: -2400, date: "Jul 31, 17:45", status: "completed" },
  { id: "a4", type: "referral", label: "Referral bonus — A. Okafor", amount: 45, date: "Jul 30, 12:10", status: "completed" },
  { id: "a5", type: "withdrawal", label: "Withdrawal — GTBank ••4821", amount: -1200, date: "Jul 29, 08:23", status: "pending" },
  { id: "a6", type: "payout", label: "Daily payout — Starter", amount: 7.2, date: "Jul 28, 09:02", status: "completed" },
];

export const PERFORMANCE_30D = [
  10250, 10310, 10405, 10380, 10490, 10620, 10585, 10710, 10880, 10940, 11020,
  10975, 11130, 11260, 11340, 11295, 11410, 11580, 11640, 11720, 11690, 11850,
  11980, 12070, 12160, 12110, 12290, 12440, 12520, 12680,
].map((value, i) => ({
  day: `Jul ${((i + 2) % 31) + 1}`,
  value,
}));

export type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  kind: "payout" | "security" | "system" | "referral";
};

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Daily payout credited", body: "$157.50 from your Diamond plan has been added to your balance.", time: "2h ago", read: false, kind: "payout" },
  { id: "n2", title: "New referral joined", body: "Amaka Okafor signed up with your code. You earned $45.00.", time: "6h ago", read: false, kind: "referral" },
  { id: "n3", title: "Withdrawal processing", body: "Your $1,200.00 withdrawal to GTBank ••4821 is being processed.", time: "1d ago", read: false, kind: "system" },
  { id: "n4", title: "New device sign-in", body: "We noticed a sign-in from Lagos, Nigeria. Was this you?", time: "3d ago", read: true, kind: "security" },
  { id: "n5", title: "Starter plan matured", body: "Your Starter plan completed. Deposit and profit returned in full.", time: "5d ago", read: true, kind: "payout" },
];

export const REFERRALS = [
  { id: "r1", name: "Amaka Okafor", joined: "Jul 30, 2026", earned: 45, status: "active" as const },
  { id: "r2", name: "Tunde Bello", joined: "Jul 12, 2026", earned: 120, status: "active" as const },
  { id: "r3", name: "Chidi Nwosu", joined: "Jun 28, 2026", earned: 30, status: "pending" as const },
  { id: "r4", name: "Zainab Yusuf", joined: "Jun 04, 2026", earned: 210, status: "active" as const },
];

export const PAYMENT_METHODS = [
  { id: "bank", label: "Bank transfer", hint: "1 – 3 hours" },
  { id: "card", label: "Debit card", hint: "Instant" },
  { id: "crypto", label: "USDT (TRC-20)", hint: "~10 minutes" },
];

export const BANK_ACCOUNTS = [
  { id: "b1", label: "GTBank ••4821", hint: "Adaeze Heaktar" },
  { id: "b2", label: "Kuda ••9034", hint: "Adaeze Heaktar" },
  { id: "b3", label: "USDT wallet ••7fA2", hint: "TRC-20" },
];

export const fmt = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const money = (n: number, digits = 2) => `$${fmt(Math.abs(n), digits)}`;
