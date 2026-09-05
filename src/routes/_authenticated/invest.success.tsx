import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect } from "react";
import { Screen } from "@/components/hk/shell";
import { Button, Card } from "@/components/hk/ui";
import { money } from "@/lib/data";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/_authenticated/invest/success")({
  head: () => ({
    meta: [
      { title: "Investment confirmed — Heaktar" },
      { name: "description", content: "Your Heaktar plan is active. Daily payouts start within 24 hours and land straight in your wallet." },
      { property: "og:title", content: "Investment confirmed — Heaktar" },
      { property: "og:description", content: "Your plan is active and daily payouts start within 24 hours." },
    ],
  }),
  component: InvestSuccess,
});

function InvestSuccess() {
  const navigate = useNavigate();
  const { lastInvestment } = useApp();

  useEffect(() => {
    if (!lastInvestment) navigate({ to: "/invest", replace: true });
  }, [lastInvestment, navigate]);

  if (!lastInvestment) return null;

  return (
    <Screen>
      <div className="flex flex-col items-center px-6 pt-16 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-accent text-accent-foreground">
          <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-7" strokeWidth={3} />
          </span>
        </span>
        <h1 className="mt-6 text-xl font-semibold tracking-tight">Investment activated</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
           Your {lastInvestment.planName} plan is live. First payout lands within 24 hours.
        </p>
      </div>

      <div className="px-5 pt-8">
        <Card>
          <div className="divide-y divide-border">
             <Row label="Plan" value={lastInvestment.planName} />
             <Row label="Amount" value={money(lastInvestment.amount)} />
             <Row label="Service fee (2%)" value={money(lastInvestment.fee)} />
             <Row label="Daily payout" value={money(lastInvestment.dailyReturn)} />
             <Row label="Term" value={`${lastInvestment.term} days`} />
             <Row label="Maturity payout" value={money(lastInvestment.maturityPayout)} />
             <Row label="Reference" value={lastInvestment.reference} />
          </div>
        </Card>
      </div>

      <div className="space-y-3 px-5 pt-6">
        <Button full onClick={() => navigate({ to: "/investments" })}>
          View my investments
        </Button>
        <Button variant="outline" full onClick={() => navigate({ to: "/dashboard" })}>
          Back to dashboard
        </Button>
      </div>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium">{value}</span>
    </div>
  );
}
