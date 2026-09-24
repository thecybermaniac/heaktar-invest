import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Building2, ChevronRight, DollarSign, Plus } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, Field, PageHeader } from "@/components/hk/ui";
import { money } from "@/lib/data";
import { submitWithdrawal } from "@/lib/withdrawals.functions";
import { usePortfolio, useRefreshPortfolio, portfolioQueryOptions } from "@/hooks/use-portfolio";
import { useWithdrawalMethod, withdrawalMethodQueryOptions } from "@/hooks/use-withdrawal";
import { toast } from "@/components/hk/toast";

export const Route = createFileRoute("/_authenticated/withdraw/")({
  head: () => ({
    meta: [
      { title: "Withdraw funds — Heaktar Nigeria" },
      {
        name: "description",
        content: "Cash out your Heaktar balance to your saved Nigerian bank account.",
      },
      { property: "og:title", content: "Withdraw funds — Heaktar Nigeria" },
      { property: "og:description", content: "Cash out to your saved bank account." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(portfolioQueryOptions()),
      context.queryClient.ensureQueryData(withdrawalMethodQueryOptions()),
    ]);
  },
  component: Withdraw,
});

function Withdraw() {
  const navigate = useNavigate();
  const { data: portfolio, isPending: balanceLoading, isError: balanceError } = usePortfolio();
  const { data: method, isPending: methodLoading } = useWithdrawalMethod();
  const refreshPortfolio = useRefreshPortfolio();
  const withdraw = useServerFn(submitWithdrawal);

  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const balance = portfolio?.balance ?? 0;
  const value = Number(amount) || 0;
  const error = value > balance ? "Amount exceeds available balance" : undefined;
  const canSubmit = !!method && value > 0 && !error && !balanceLoading && !balanceError && !submitting;

  async function handleConfirm() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await withdraw({ data: { amount: value } });
      await refreshPortfolio();
      setDone(true);
      toast.success("Withdrawal submitted", `${money(result.amount)} is being processed.`);
    } catch (err) {
      toast.error("Withdrawal not submitted", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Screen>
        <PageHeader title="Withdraw" subtitle="Move money out of Heaktar" />
        <div className="space-y-4 px-5 pt-5">
          <Card className="border-primary bg-accent/40 text-center">
            <p className="text-2xl font-semibold">{money(value)}</p>
            <p className="mt-1 text-[13px] font-medium text-accent-foreground">
              Withdrawal request submitted
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Paying out to {method?.bankName} ••{method?.accountNumber.slice(-4)} (
              {method?.accountName}). Funds typically arrive within 3 hours.
            </p>
          </Card>
          <Button full onClick={() => navigate({ to: "/dashboard" })}>
            Back to dashboard
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="Withdraw" subtitle="Move money out of Heaktar" />
      <div className="space-y-4 px-5 pt-5">
        <div className="rounded bg-gradient-brand p-4 text-primary-foreground shadow-float">
          <span className="text-xs opacity-80">Available balance</span>
          <p className="mt-1 text-2xl font-semibold">
            {balanceLoading ? "Loading…" : money(balance)}
          </p>
          {balanceError && (
            <p className="mt-1 text-xs text-primary-foreground/80">
              Balance unavailable. Please try again.
            </p>
          )}
        </div>

        <Field
          icon={"₦"}
          label="Amount"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          error={error}
          trailing={
            <button
              className="text-xs font-medium text-primary disabled:opacity-50"
              onClick={() => setAmount(String(balance))}
              type="button"
              disabled={balanceLoading || balance <= 0}
            >
              Max
            </button>
          }
        />

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Destination</span>
          {methodLoading ? (
            <Card>
              <p className="text-xs text-muted-foreground">Loading your withdrawal method…</p>
            </Card>
          ) : method ? (
            <button
              onClick={() => navigate({ to: "/withdraw/method" })}
              className="flex w-full items-center gap-3 rounded border border-border bg-card p-4 text-left"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
                <Building2 className="size-4.5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">
                  {method.bankName} ••{method.accountNumber.slice(-4)}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {method.accountName}
                </span>
              </span>
              <span className="shrink-0 text-xs font-medium text-primary">Update</span>
            </button>
          ) : (
            <button
              onClick={() => navigate({ to: "/withdraw/method" })}
              className="flex w-full items-center gap-3 rounded border border-dashed border-primary/50 bg-accent/20 p-4 text-left"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Plus className="size-4.5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium">Add a withdrawal method</span>
                <span className="block text-[11px] text-muted-foreground">
                  Required before you can withdraw
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          )}
        </div>

        <Card>
          <div className="flex items-center justify-between py-1 text-xs">
            <span className="text-muted-foreground">Processing fee</span>
            <span className="text-[13px] font-medium">{money(0)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-xs">
            <span className="text-muted-foreground">You'll receive</span>
            <span className="text-[13px] font-semibold">{money(Math.max(value, 0))}</span>
          </div>
        </Card>

        <Button full disabled={!canSubmit} onClick={handleConfirm}>
          {submitting ? "Submitting…" : "Confirm withdrawal"}
        </Button>
        {!method && !methodLoading && (
          <p className="text-center text-[11px] text-muted-foreground">
            Add a withdrawal method above to enable withdrawals.
          </p>
        )}
      </div>
    </Screen>
  );
}
