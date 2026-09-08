import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, PageHeader, StatusPill } from "@/components/hk/ui";
import { money } from "@/lib/data";
import { useApp } from "@/lib/app-store";
import { cn } from "@/lib/utils";
import { usePlans } from "@/hooks/use-portfolio";

export const Route = createFileRoute("/_authenticated/invest/")({
  head: () => ({
    meta: [
      { title: "Choose a plan — Heaktar" },
      {
        name: "description",
        content:
          "Compare Heaktar's Starter, Silver, Diamond and Platinum plans by daily interest, term length and total return.",
      },
      { property: "og:title", content: "Choose a plan — Heaktar" },
      {
        property: "og:description",
        content: "Starter, Silver, Diamond and Platinum daily-yield investment plans.",
      },
    ],
  }),
  component: SelectPlan,
});

function SelectPlan() {
  const navigate = useNavigate();
  const { draft, setDraft } = useApp();
  const { data: plans, isPending, isError } = usePlans();

  return (
    <Screen>
      <PageHeader title="Select a plan" subtitle="Step 1 of 3" />
      <div className="space-y-3 px-5 pt-5">
        {isPending && (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading plans…</p>
        )}
        {isError && (
          <p className="py-10 text-center text-sm text-destructive">
            Plans are unavailable right now. Please try again.
          </p>
        )}
        {plans?.map((plan) => {
          const selected = draft.planId === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => setDraft({ planId: plan.id })}
              className={cn(
                "w-full rounded border p-4 text-left transition-all",
                selected ? "border-primary bg-accent/40 shadow-card" : "border-border bg-card",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold">{plan.name}</h2>
                  <StatusPill tone="success">{plan.dailyInterest}% daily</StatusPill>
                </div>
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full border",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {selected && <Check className="size-3" strokeWidth={3} />}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{plan.tagline}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="Term" value={`${plan.term} days`} />
                <Metric label="Min Investment" value={`${money(plan.minAmount, 0)}`} />
                <Metric label="Total return" value={`${plan.totalReturn}%`} />
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                {plan.depositReturned
                  ? "Capital returned at maturity"
                  : "Capital reinvested at maturity"}
              </p>
            </button>
          );
        })}
      </div>

      {!isPending && !isError && (
        <div className="px-5 pt-6">
          <Button
            full
            disabled={!draft.planId || !plans?.length}
            onClick={() => navigate({ to: "/invest/details" })}
          >
            Continue
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted border border-border px-2 py-2">
      <span className="block text-[10px] text-muted-foreground">{label}</span>
      <span className="mt-0.5 block text-[11px] font-semibold">{value}</span>
    </div>
  );
}
