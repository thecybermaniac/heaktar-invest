import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, DollarSign } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, Field, PageHeader } from "@/components/hk/ui";
import { PAYMENT_METHODS, money } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/deposit")({
  head: () => ({
    meta: [
      { title: "Deposit funds — Heaktar" },
      { name: "description", content: "Top up your Heaktar wallet by bank transfer, debit card or USDT and start investing immediately." },
      { property: "og:title", content: "Deposit funds — Heaktar" },
      { property: "og:description", content: "Top up by bank transfer, card or USDT and invest immediately." },
    ],
  }),
  component: Deposit,
});

function Deposit() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [done, setDone] = useState(false);
  const value = Number(amount) || 0;

  return (
    <Screen>
      <PageHeader title="Deposit" subtitle="Add money to your wallet" />
      <div className="space-y-4 px-5 pt-5">
        <Field
          icon={DollarSign}
          label="Amount"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
        />
        <div className="flex gap-2">
          {[100, 500, 1000, 5000].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className="flex-1 rounded-xl border border-border bg-card py-2 text-xs font-medium"
            >
              ${v}
            </button>
          ))}
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Payment method</span>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border p-4 text-left",
                  method === m.id ? "border-primary bg-accent/40" : "border-border bg-card",
                )}
              >
                <span>
                  <span className="block text-[13px] font-medium">{m.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
                </span>
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full border",
                    method === m.id ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {method === m.id && <Check className="size-3" strokeWidth={3} />}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">You'll be credited</span>
            <span className="text-[13px] font-semibold">{money(value)}</span>
          </div>
        </Card>

        {done ? (
          <Card className="border-primary bg-accent/40">
            <p className="text-[13px] font-medium text-accent-foreground">
              Deposit of {money(value)} initiated. We'll notify you once it clears.
            </p>
            <Button variant="outline" full className="mt-3" onClick={() => navigate({ to: "/dashboard" })}>
              Back to dashboard
            </Button>
          </Card>
        ) : (
          <Button full disabled={value <= 0} onClick={() => setDone(true)}>
            Confirm deposit
          </Button>
        )}
      </div>
    </Screen>
  );
}
