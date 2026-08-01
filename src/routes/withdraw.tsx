import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, DollarSign } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, Field, PageHeader } from "@/components/hk/ui";
import { BANK_ACCOUNTS, money } from "@/lib/data";
import { useApp } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw funds — Heaktar" },
      { name: "description", content: "Cash out your Heaktar balance to a saved bank account or USDT wallet with same-day processing." },
      { property: "og:title", content: "Withdraw funds — Heaktar" },
      { property: "og:description", content: "Cash out to a saved bank account or USDT wallet." },
    ],
  }),
  component: Withdraw,
});

function Withdraw() {
  const navigate = useNavigate();
  const { balance } = useApp();
  const [amount, setAmount] = useState("");
  const [dest, setDest] = useState("b1");
  const [done, setDone] = useState(false);
  const value = Number(amount) || 0;
  const error = value > balance ? "Amount exceeds available balance" : undefined;

  return (
    <Screen>
      <PageHeader title="Withdraw" subtitle="Move money out of Heaktar" />
      <div className="space-y-4 px-5 pt-5">
        <div className="rounded-2xl bg-gradient-brand p-4 text-primary-foreground shadow-float">
          <span className="text-xs opacity-80">Available balance</span>
          <p className="mt-1 text-2xl font-semibold">{money(balance)}</p>
        </div>

        <Field
          icon={DollarSign}
          label="Amount"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          error={error}
          trailing={
            <button className="text-xs font-medium text-primary" onClick={() => setAmount(String(balance))} type="button">
              Max
            </button>
          }
        />

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Destination</span>
          <div className="space-y-2">
            {BANK_ACCOUNTS.map((b) => (
              <button
                key={b.id}
                onClick={() => setDest(b.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border p-4 text-left",
                  dest === b.id ? "border-primary bg-accent/40" : "border-border bg-card",
                )}
              >
                <span>
                  <span className="block text-[13px] font-medium">{b.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{b.hint}</span>
                </span>
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full border",
                    dest === b.id ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {dest === b.id && <Check className="size-3" strokeWidth={3} />}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between py-1 text-xs">
            <span className="text-muted-foreground">Processing fee</span>
            <span className="text-[13px] font-medium">{money(value ? 1.5 : 0)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-xs">
            <span className="text-muted-foreground">You'll receive</span>
            <span className="text-[13px] font-semibold">{money(Math.max(value - (value ? 1.5 : 0), 0))}</span>
          </div>
        </Card>

        {done ? (
          <Card className="border-primary bg-accent/40">
            <p className="text-[13px] font-medium text-accent-foreground">
              Withdrawal of {money(value)} submitted. Funds typically arrive within 3 hours.
            </p>
            <Button variant="outline" full className="mt-3" onClick={() => navigate({ to: "/dashboard" })}>
              Back to dashboard
            </Button>
          </Card>
        ) : (
          <Button full disabled={value <= 0 || !!error} onClick={() => setDone(true)}>
            Confirm withdrawal
          </Button>
        )}
      </div>
    </Screen>
  );
}
