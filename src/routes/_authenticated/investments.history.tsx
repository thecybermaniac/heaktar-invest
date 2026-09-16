import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/hk/shell";
import { Card, Chips, StatusPill } from "@/components/hk/ui";
import { money } from "@/lib/data";
import { Tabs } from "./investments.index";
import { usePortfolio, portfolioQueryOptions } from "@/hooks/use-portfolio";

export const Route = createFileRoute("/_authenticated/investments/history")({
  head: () => ({
    meta: [
      { title: "Investment history — Heaktar" },
      { name: "description", content: "Review every matured Heaktar plan with capital returned, profit earned and completion dates." },
      { property: "og:title", content: "Investment history — Heaktar" },
      { property: "og:description", content: "Every matured plan with capital returned and profit earned." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(portfolioQueryOptions()),
  component: History,
});

function History() {
  const [filter, setFilter] = useState("All plans");
  const options = ["All plans", "Starter", "Silver", "Diamond", "Platinum"];
  const { data: portfolio, isPending, isError } = usePortfolio();
  const rows = (portfolio?.history ?? []).filter((i) => filter === "All plans" || i.planName === filter);
  const totalProfit = rows.reduce((s, i) => s + i.earned, 0);

  return (
    <Screen>
      <header className="px-5 pt-6">
        <h1 className="text-xl font-semibold tracking-tight">My investments</h1>
        <p className="mt-1 text-sm text-muted-foreground">Completed plans and settled payouts.</p>
      </header>

      <Tabs active="history" />

      <div className="px-5">
        <Chips value={filter} onChange={setFilter} options={options} />
      </div>

      <div className="px-5 pt-4">
        <Card className="p-3.5">
          <span className="text-[11px] text-muted-foreground">Total profit realised</span>
          <p className="mt-1 text-lg font-semibold text-success">+{money(totalProfit)}</p>
        </Card>
      </div>

      <div className="mt-3 space-y-3 px-5">
        {isPending && <p className="py-10 text-center text-sm text-muted-foreground">Loading history…</p>}
        {isError && <p className="py-10 text-center text-sm text-destructive">History is unavailable right now. Please try again.</p>}
        {!isPending && !isError && rows.map((inv) => (
          <Card key={inv.id}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold">{inv.planName}</h2>
                <p className="text-[11px] text-muted-foreground">
                  {inv.startedAt} · {inv.term} days
                </p>
              </div>
              <StatusPill tone="muted">Completed</StatusPill>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Invested {money(inv.amount, 0)}</span>
              <span className="font-semibold text-success">+{money(inv.earned)}</span>
            </div>
          </Card>
        ))}
        {!isPending && !isError && rows.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No investments in this plan yet.</p>
        )}
      </div>
    </Screen>
  );
}
