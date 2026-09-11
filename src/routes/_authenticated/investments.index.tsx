import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/hk/shell";
import { Card, Metric, StatusPill } from "@/components/hk/ui";
import { money } from "@/lib/data";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/hooks/use-portfolio";

export const Route = createFileRoute("/_authenticated/investments/")({
  head: () => ({
    meta: [
      { title: "Active investments — Heaktar" },
      { name: "description", content: "Monitor every running Heaktar plan: amount staked, daily return, days remaining and progress to maturity." },
      { property: "og:title", content: "Active investments — Heaktar" },
      { property: "og:description", content: "Every running plan with daily return and progress to maturity." },
    ],
  }),
  component: ActiveInvestments,
});

function ActiveInvestments() {
  const { data: portfolio, isPending, isError } = usePortfolio();
  const investments = portfolio?.active ?? [];
  const totalStaked = investments.reduce((s, i) => s + i.amount, 0);
  const paidProfitTotal = investments.reduce((s, i) => s + i.earned, 0);

  return (
    <Screen>
      <header className="px-5 pt-6">
        <h1 className="text-xl font-semibold">My investments</h1>
        <p className="mt-1 text-sm text-muted-foreground">{investments.length} plans currently running.</p>
      </header>

      <Tabs active="active" />

      <div className="grid grid-cols-2 gap-3 px-5">
        <Card className="p-3.5">
          <span className="text-[11px] text-muted-foreground">Total invested</span>
          <p className="mt-1 text-lg font-semibold">{money(totalStaked, 0)}</p>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-muted-foreground">Profit paid</span>
          <p className="mt-1 text-lg font-semibold text-success">+{money(paidProfitTotal)}</p>
        </Card>
      </div>

      <div className="mt-4 space-y-3 px-5">
        {isPending && <p className="py-10 text-center text-sm text-muted-foreground">Loading investments…</p>}
        {isError && <p className="py-10 text-center text-sm text-destructive">Investments are unavailable right now. Please try again.</p>}
        {!isPending && !isError && investments.map((inv) => {
          const pct = Math.round((inv.daysElapsed / inv.term) * 100);
          return (
            <Card key={inv.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold">{inv.planName}</h2>
                  <p className="text-[11px] text-muted-foreground">Started {inv.startedAt}</p>
                </div>
                <StatusPill tone="success">Active</StatusPill>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="Invested" value={money(inv.amount, 0)} />
                <Metric label="Daily return" value={`+${money(inv.dailyReturn)}`} accent />
                <Metric label="Profit paid" value={money(inv.earned)} />
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{inv.daysElapsed} of {inv.term} days credited</span>
                  <span>{inv.term - inv.daysElapsed} days left</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-input">
                  <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Card>
          );
        })}
        {!isPending && !isError && investments.length === 0 && (
          <Card><p className="text-[13px] text-muted-foreground">You have no active investments yet.</p></Card>
        )}
      </div>
    </Screen>
  );
}

export function Tabs({ active }: { active: "active" | "history" }) {
  return (
    <div className="px-5 py-4">
      <div className="flex gap-1 rounded bg-input p-1">
        <Link
          to="/investments"
          className={cn(
            "h-10 flex-1 rounded text-center text-xs font-medium leading-10 transition-all",
            active === "active" ? "bg-primary text-foreground shadow-card" : "text-muted-foreground",
          )}
        >
          Active
        </Link>
        <Link
          to="/investments/history"
          className={cn(
            "h-10 flex-1 rounded text-center text-xs font-medium leading-10 transition-all",
            active === "history" ? "bg-primary text-foreground shadow-card" : "text-muted-foreground",
          )}
        >
          History
        </Link>
      </div>
    </div>
  );
}
