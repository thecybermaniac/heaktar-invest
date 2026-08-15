import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Field, PageHeader } from "@/components/hk/ui";
import { PAYMENT_METHODS, money } from "@/lib/data";
import { cn } from "@/lib/utils";
import { initializeDeposit } from "@/lib/paystack.server";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/deposit/")({
  head: () => ({
    meta: [
      { title: "Deposit funds — Heaktar" },
      {
        name: "description",
        content:
          "Top up your Heaktar wallet by bank transfer, debit card or USDT and start investing immediately.",
      },
      { property: "og:title", content: "Deposit funds — Heaktar" },
      {
        property: "og:description",
        content: "Top up by bank transfer, card or USDT and invest immediately.",
      },
    ],
  }),
  component: Deposit,
});

function Deposit() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const value = Number(amount) || 0;

  async function handleDeposit() {
    if (value <= 0 || !user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const { authorizationUrl } = await initializeDeposit({
        data: { amount: value, email: user.email, method: method as any },
      });
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Deposit" subtitle="Add money to your wallet" />
      <div className="space-y-4 px-5 pt-5">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Payment method
          </span>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded border p-4 text-left",
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
                    method === m.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {method === m.id && <Check className="size-3" strokeWidth={3} />}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Field
          icon={"₦"}
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
              ₦{v}
            </button>
          ))}
        </div>

        {error && <p className="text-[13px] font-medium text-destructive">{error}</p>}

        <Button full disabled={value <= 0 || loading} onClick={handleDeposit}>
          {loading ? "Redirecting to Paystack…" : "Continue Deposit"}
        </Button>
      </div>
    </Screen>
  );
}