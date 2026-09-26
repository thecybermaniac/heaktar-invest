import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, Field, PageHeader, StatusPill } from "@/components/hk/ui";
import { SERVICE_FEE_RATE, money } from "@/lib/data";
import { useInvestmentFlow } from "@/lib/app-store";
import { usePlans, plansQueryOptions } from "@/hooks/use-portfolio";
import { startInvestment } from "@/lib/portfolio.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/components/hk/toast";

export const Route = createFileRoute("/_authenticated/invest/details")({
  head: () => ({
    meta: [
      { title: "Investment details — Heaktar Nigeria" },
      { name: "description", content: "Enter your amount and preview the 2% service fee, daily payout and total return before you confirm." },
      { property: "og:title", content: "Investment details — Heaktar Nigeria" },
      { property: "og:description", content: "Preview fees, daily payouts and total return before confirming." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(plansQueryOptions()),
  component: InvestDetails,
});

function InvestDetails() {
  const navigate = useNavigate();
  const { draft, setDraft, setLastInvestment } = useInvestmentFlow();
  const { data: plans, isPending } = usePlans();
  const start = useServerFn(startInvestment);
  const [submitting, setSubmitting] = useState(false);
  const plan = plans?.find((p) => p.id === draft.planId);
  const [raw, setRaw] = useState(draft.amount ? String(draft.amount) : "");

  if (isPending) {
    return (
      <Screen>
        <PageHeader title="Investment details" subtitle="Step 2 of 3" />
        <p className="px-5 pt-10 text-center text-sm text-muted-foreground">Loading plan details…</p>
      </Screen>
    );
  }

  if (!plan) {
    return (
      <Screen>
        <PageHeader title="Investment details" subtitle="Step 2 of 3" />
        <div className="px-5 pt-10 text-center">
          <p className="text-sm text-muted-foreground">Choose an available plan to continue.</p>
          <Button className="mt-5" onClick={() => navigate({ to: "/invest" })}>
            Choose a plan
          </Button>
        </div>
      </Screen>
    );
  }

  const selectedPlan = plan;

  const amount = Number(raw) || 0;
  const fee = amount * SERVICE_FEE_RATE;
  const dailyPayout = (amount * plan.dailyInterest) / 100;
  const totalProfit = (amount * plan.totalReturn) / 100;
  const payout = plan.depositReturned ? amount + totalProfit : totalProfit;

  const error =
    raw === ""
      ? undefined
      : amount < plan.minAmount
        ? `Minimum for ${plan.name} is ${money(plan.minAmount, 0)}`
        : amount > plan.maxAmount
          ? `Maximum for ${plan.name} is ${money(plan.maxAmount, 0)}`
          : undefined;
  const valid = !!raw && !error;

  async function handleConfirm() {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const investment = await start({ data: { planId: selectedPlan.id, amount } });
      setLastInvestment(investment);
      toast.success("Investment activated", `${selectedPlan.name} is now earning daily returns.`);
      navigate({ to: "/invest/success" });
    } catch (err) {
      toast.error("Investment not started", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Investment details" subtitle="Step 2 of 3" />

      <div className="space-y-4 px-5 pt-5">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">{plan.name} plan</h2>
            <StatusPill tone="success">{plan.dailyInterest}% daily</StatusPill>
          </div>
          <div className="mt-4 divide-y divide-border">
            <Row label="Term" value={`${plan.term} days`} />
            <Row label="Investment range" value={`${money(plan.minAmount, 0)} – ${money(plan.maxAmount, 0)}`} />
            <Row label="Total return" value={`${plan.totalReturn}%`} />
            <Row label="Deposit returned" value={plan.depositReturned ? "Yes, at maturity" : "No"} />
          </div>
        </Card>

        <Field
          icon={"₦"}
          label="Amount to Invest"
          inputMode="decimal"
          placeholder={`${plan.minAmount}`}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value.replace(/[^0-9.]/g, ""));
            setDraft({ amount: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 });
          }}
          error={error}
          hint={`Enter between ${money(plan.minAmount, 0)} and ${money(plan.maxAmount, 0)}`}
        />

        <Card>
          <h3 className="text-sm font-semibold">Summary</h3>
          <div className="mt-3 divide-y divide-border">
            <Row label="Amount" value={money(amount)} />
            <Row label="Service fee (2%)" value={`− ${money(fee)}`} />
            <Row label="Daily payout" value={money(dailyPayout)} />
            <Row label={`Profit over ${plan.term} days`} value={money(totalProfit)} accent />
            <Row label="Total payout at maturity" value={money(payout)} accent />
          </div>
        </Card>

        <Button full disabled={!valid || submitting} onClick={handleConfirm}>
          {submitting ? "Activating…" : "Confirm Investment"}
        </Button>
        <p className="pb-2 text-center text-[11px] text-muted-foreground">
          A 2% service fee is deducted from your wallet at activation.
        </p>
      </div>
    </Screen>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={accent ? "text-[13px] font-semibold text-success" : "text-[13px] font-medium"}>{value}</span>
    </div>
  );
}
