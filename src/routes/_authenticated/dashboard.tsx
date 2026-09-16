import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Eye,
  EyeOff,
  Gift,
  Plus,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Card, Metric, StatusPill } from "@/components/hk/ui";
import { useApp } from "@/lib/app-store";
import { money } from "@/lib/data";
import { usePortfolio, portfolioQueryOptions } from "@/hooks/use-portfolio";
import { useNotifications, notificationsQueryOptions } from "@/hooks/use-notifications";
import type { InvestmentView } from "@/lib/portfolio.server";
import { useMarketQuotes } from "@/hooks/use-market";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Heaktar" },
      {
        name: "description",
        content:
          "Track your Heaktar balance, live Big-5 market prices, 30-day performance and recent account activity.",
      },
      { property: "og:title", content: "Dashboard — Heaktar" },
      {
        property: "og:description",
        content: "Balance, live markets and 30-day portfolio performance at a glance.",
      },
    ],
  }),
  // Starts these fetching during the route transition instead of after Dashboard mounts —
  // ensureQueryData reuses an in-flight/fresh cache entry rather than re-fetching, so this
  // is free when the data's already warm (e.g. navigating back from another tab).
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(portfolioQueryOptions()),
      context.queryClient.ensureQueryData(notificationsQueryOptions()),
    ]);
  },
  component: Dashboard,
});

const AUTO_ADVANCE_MS = 5000;
const SWIPE_THRESHOLD = 40;

function ActivePlansCarousel({ investments }: { investments: InvestmentView[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const total = investments.length;

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
    // restarting on every index change means a manual swipe/dot click
    // resets the auto-advance timer, instead of firing right after
  }, [total, index]);

  function goTo(i: number) {
    setIndex(((i % total) + total) % total);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const startX = touchStartX.current;
    if (startX === null) return;

    const touch = e.changedTouches[0];
    if (!touch) {
      touchStartX.current = null;
      return;
    }

    const delta = touch.clientX - startX;
    if (delta > SWIPE_THRESHOLD) goTo(index - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(index + 1);
    touchStartX.current = null;
  }

  return (
    <div>
      <div
        className="overflow-hidden px-5"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {investments.map((inv) => {
            const pct = Math.round((inv.daysElapsed / inv.term) * 100);
            return (
              <div key={inv.id} className="w-full shrink-0 px-1.5 first:pl-0 last:pr-0">
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[15px] font-semibold">{inv.planName}</h2>
                      <p className="text-[11px] text-muted-foreground">Started {inv.startedAt}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Metric label="Invested" value={money(inv.amount, 0)} />
                    <Metric label="Daily return" value={`+${money(inv.dailyReturn)}`} accent />
                    <Metric label="Profit paid" value={money(inv.earned)} />
                  </div>

                  <div className="mt-4">
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-input">
                      <div
                        className="h-full rounded-full bg-gradient-brand"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {total > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {investments.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to plan ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-primary" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const { profile } = useApp();
  const { data: portfolio, isPending } = usePortfolio();
  const { unread } = useNotifications();
  const balance = portfolio?.balance ?? 0;
  const netInvestment = portfolio?.netInvestment ?? 0;
  const netProfit = portfolio?.netProfit ?? 0;
  const active = portfolio?.active ?? [];
  const performance = portfolio?.performance ?? [];
  const changePct = portfolio?.performanceChangePct ?? 0;
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const mask = (v: string) => (hidden ? "••••••" : v);

  return (
    <Screen>
      <header className="flex items-center justify-between px-4 pt-5">
        <Link to="/profile" className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-border">
            <User />
          </span>
          <span>
            <span className="block text-xs text-muted-foreground">Welcome back,</span>
            <span className="block text-sm font-semibold">{profile.firstName}</span>
          </span>
        </Link>
        <Link
          to="/notifications"
          className="relative grid size-11 place-items-center rounded-full hover:bg-border/50"
          aria-label="Notifications"
        >
          <Bell className="size-4.75" strokeWidth={1.8} />
          {unread > 0 && (
            <span className="absolute right-2 top-2 grid size-2 place-items-center rounded-full bg-destructive"></span>
          )}
        </Link>
      </header>

      <section className="px-5 pt-5">
        <div className="rounded border border-primary p-5 shadow-float">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Total balance</span>
              <button onClick={() => setHidden((h) => !h)} aria-label="Toggle balance visibility">
                {hidden ? (
                  <EyeOff className="size-4 opacity-80" strokeWidth={1.8} />
                ) : (
                  <Eye className="size-4 opacity-80" strokeWidth={1.8} />
                )}
              </button>
            </div>

            <button
              className="flex bg-primary text-xs items-center py-2 px-4 rounded-full gap-1 tracking-wide"
              onClick={() => navigate({ to: "/deposit" })}
            >
              <Plus size={15} />
              Deposit
            </button>
          </div>

          <p className="mt-1 text-[34px] font-semibold leading-tight tracking-tight text-foreground dark:text-primary-foreground">
            {isPending ? "—" : mask(money(balance))}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded bg-muted dark:bg-white/5 p-3">
              <span className="block text-[11px] text-muted-foreground">Net investment</span>
              <span className="mt-0.5 block text-base font-semibold text-foreground dark:text-primary-foreground">
                {mask(money(netInvestment))}
              </span>
            </div>
            <div className="rounded bg-muted dark:bg-white/5 p-3">
              <span className="block text-[11px] text-muted-foreground">Net profit</span>
              <span className="mt-0.5 block text-base font-semibold text-foreground dark:text-primary-foreground">
                {hidden ? "••••••" : `${money(netProfit)}`}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-6">
        <div className="flex items-center justify-between mb-3 px-5">
          <h2 className="text-sm font-medium">Active Plans</h2>
          {active.length > 0 && (
            <Link to="/investments" className="text-xs text-muted-foreground hover:text-primary">
              See all
            </Link>
          )}
        </div>
        {active.length > 0 ? (
          <ActivePlansCarousel investments={active} />
        ) : (
          <div className="px-5">
            <Card>
              <p className="text-[13px] text-muted-foreground text-center">
                No active plans yet. Pick a plan to start earning daily.
              </p>
              <Link
                to="/invest"
                className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
              >
                Browse plans
              </Link>
            </Card>
          </div>
        )}
      </section>

      <section className="px-5 pt-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Performance</h2>
              <p className="text-[11px] text-muted-foreground">Trailing 1 month</p>
            </div>
            <StatusPill
              tone={changePct < 0 ? "muted" : "success"}
            >{`${changePct >= 0 ? "+" : ""}${changePct}%`}</StatusPill>
          </div>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performance} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="perf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin - 300", "dataMax + 200"]} />
                <Tooltip
                  cursor={{ stroke: "var(--border)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number) => [money(v), "Value"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2.4}
                  fill="url(#perf)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="px-5 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent Activity</h2>
          <Link
            to="/investments/history"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            See all
          </Link>
        </div>
        <div className="space-y-2">
          {(portfolio?.activities ?? []).map((a) => {
            const positive = a.amount > 0;
            const Icon =
              a.type === "deposit"
                ? ArrowDownLeft
                : a.type === "withdrawal"
                  ? ArrowUpRight
                  : a.type === "referral"
                    ? Gift
                    : a.type === "investment"
                      ? Plus
                      : TrendingUp;
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded border border-border bg-card p-3.5"
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full",
                    positive
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4.5" strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground">{a.date}</p>
                </div>
                <div className="text-right">
                  {a.status !== "completed" && <StatusPill tone="muted">{a.status}</StatusPill>}
                  <p
                    className={cn(
                      "text-[13px] font-semibold mt-2",
                      positive ? "text-success" : "text-foreground",
                    )}
                  >
                    {positive ? "+" : "−"}
                    {money(a.amount)}
                  </p>
                </div>
              </div>
            );
          })}
          {!isPending && (portfolio?.activities.length ?? 0) === 0 && (
            <Card>
              <p className="text-[13px] text-muted-foreground">
                Your deposits, investments and payouts will appear here.
              </p>
            </Card>
          )}
        </div>
      </section>
    </Screen>
  );
}
