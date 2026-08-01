import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { ArrowDownLeft, ArrowUpRight, Bell, Eye, EyeOff, Gift, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Card, StatusPill } from "@/components/hk/ui";
import { useApp } from "@/lib/app-store";
import { ACTIVITIES, PERFORMANCE_30D, money } from "@/lib/data";
import { useMarketQuotes } from "@/hooks/use-market";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Heaktar" },
      { name: "description", content: "Track your Heaktar balance, live Big-5 market prices, 30-day performance and recent account activity." },
      { property: "og:title", content: "Dashboard — Heaktar" },
      { property: "og:description", content: "Balance, live markets and 30-day portfolio performance at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, balance, netInvestment, netProfit, unread } = useApp();
  const [hidden, setHidden] = useState(false);
  const { quotes, live } = useMarketQuotes();

  const mask = (v: string) => (hidden ? "••••••" : v);

  return (
    <Screen>
      <header className="flex items-center justify-between px-5 pt-5">
        <Link to="/profile" className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground">
            {profile.firstName[0]}
            {profile.lastName[0]}
          </span>
          <span>
            <span className="block text-xs text-muted-foreground">Welcome back</span>
            <span className="block text-sm font-semibold">{profile.firstName}</span>
          </span>
        </Link>
        <Link to="/notifications" className="relative grid size-11 place-items-center rounded-full border border-border bg-card" aria-label="Notifications">
          <Bell className="size-[19px]" strokeWidth={1.8} />
          {unread > 0 && (
            <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Link>
      </header>

      <section className="px-5 pt-5">
        <div className="rounded-3xl bg-gradient-brand p-5 text-primary-foreground shadow-float">
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-80">Total balance</span>
            <button onClick={() => setHidden((h) => !h)} aria-label="Toggle balance visibility">
              {hidden ? <EyeOff className="size-4 opacity-80" /> : <Eye className="size-4 opacity-80" />}
            </button>
          </div>
          <p className="mt-1 text-[34px] font-semibold leading-tight tracking-tight">{mask(money(balance))}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/12 p-3">
              <span className="block text-[11px] opacity-80">Net investment</span>
              <span className="mt-0.5 block text-base font-semibold">{mask(money(netInvestment, 0))}</span>
            </div>
            <div className="rounded-2xl bg-white/12 p-3">
              <span className="block text-[11px] opacity-80">Net profit</span>
              <span className="mt-0.5 block text-base font-semibold">
                {hidden ? "••••••" : `+${money(netProfit)}`}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <QuickAction to="/deposit" icon={ArrowDownLeft} label="Deposit" />
            <QuickAction to="/withdraw" icon={ArrowUpRight} label="Withdraw" />
            <QuickAction to="/invest" icon={Plus} label="Invest" />
          </div>
        </div>
      </section>

      <section className="pt-6">
        <div className="flex items-center justify-between px-5">
          <h2 className="text-sm font-semibold">Market</h2>
          <span className="text-[11px] text-muted-foreground">{live ? "Live · Twelve Data" : "Delayed snapshot"}</span>
        </div>
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
          {quotes.map((q) => {
            const up = q.changePercent >= 0;
            return (
              <div key={q.symbol} className="min-w-[128px] shrink-0 rounded-2xl border border-border bg-card p-3 shadow-card">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Market</span>
                <p className="mt-1 text-sm font-semibold">{q.name}</p>
                <p className="text-[11px] text-muted-foreground">{q.symbol}</p>
                <p className="mt-2 text-sm font-semibold">${q.price.toFixed(2)}</p>
                <p className={cn("mt-0.5 flex items-center gap-1 text-[11px] font-medium", up ? "text-success" : "text-destructive")}>
                  {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {up ? "+" : ""}
                  {q.changePercent.toFixed(2)}%
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 pt-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Performance</h2>
              <p className="text-[11px] text-muted-foreground">Trailing 1 month</p>
            </div>
            <StatusPill tone="success">+23.7%</StatusPill>
          </div>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_30D} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
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
                <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.4} fill="url(#perf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="px-5 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <Link to="/investments/history" className="text-xs font-medium text-primary">
            See all
          </Link>
        </div>
        <div className="space-y-2">
          {ACTIVITIES.map((a) => {
            const positive = a.amount > 0;
            const Icon = a.type === "deposit" ? ArrowDownLeft : a.type === "withdrawal" ? ArrowUpRight : a.type === "referral" ? Gift : a.type === "investment" ? Plus : TrendingUp;
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", positive ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                  <Icon className="size-[18px]" strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground">{a.date}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-[13px] font-semibold", positive ? "text-success" : "text-foreground")}>
                    {positive ? "+" : "−"}
                    {money(a.amount)}
                  </p>
                  {a.status !== "completed" && (
                    <p className="text-[10px] capitalize text-muted-foreground">{a.status}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Screen>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Plus; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/12 py-2.5 text-[11px] font-medium transition-colors hover:bg-white/20"
    >
      <Icon className="size-[18px]" strokeWidth={2} />
      {label}
    </Link>
  );
}
