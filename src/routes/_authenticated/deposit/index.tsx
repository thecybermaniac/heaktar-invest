import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building, Building2, Check, CreditCard, Home } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Field, PageHeader } from "@/components/hk/ui";
import { PAYMENT_METHODS, money } from "@/lib/data";
import { cn } from "@/lib/utils";
import { initializeDeposit } from "@/lib/paystack.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/deposit/")({
  validateSearch: (search: Record<string, unknown>) =>
    typeof search["error"] === "string" ? { error: search["error"] } : {},
  head: () => ({
    meta: [
      { title: "Deposit funds — Heaktar Nigeria" },
      {
        name: "description",
        content:
          "Top up your Heaktar wallet by bank transfer or debit card and start investing immediately.",
      },
      { property: "og:title", content: "Deposit funds — Heaktar Nigeria" },
      {
        property: "og:description",
        content: "Top up by bank transfer or card and invest immediately.",
      },
    ],
  }),
  component: Deposit,
});

const ERROR_MESSAGES: Record<string, string> = {
  payment_cancelled: "Payment cancelled — no charge was made.",
  payment_failed: "That payment didn't go through. You can try again.",
  verification_failed:
    "We couldn't confirm that payment. If you were charged, contact support with your reference.",
};

function Deposit() {
  const { user } = useAuth();
  const { error: errorCode } = Route.useSearch();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"card" | "bank_transfer">("bank_transfer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorCode ? (ERROR_MESSAGES[errorCode] ?? null) : null);
  const value = Number(amount) || 0;

  // window.location.href navigates fully away to Paystack's hosted checkout. If the person
  // cancels there via their browser's back button rather than Paystack's own cancel flow,
  // the browser can restore this exact page from bfcache — including whatever React state
  // it had when it left, which was mid "Redirecting to Paystack…". Without this, the button
  // stays stuck saying that forever even though nothing is actually happening anymore.
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) setLoading(false);
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  async function handleDeposit() {
    if (value <= 0 || !user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const { authorizationUrl } = await initializeDeposit({
        data: { amount: value, email: user.email, method },
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
                onClick={() => setMethod(m.id as "card" | "bank_transfer")}
                className={cn(
                  "flex w-full items-center justify-between rounded border p-4 text-left",
                  method === m.id ? "border-primary bg-accent/40" : "border-border bg-card",
                )}
              >
                <span>
                  <div className="mb-1.5 flex items-center text-[13px] font-medium">
                    {m.id === "bank_transfer" ? (
                      <Building2 className="mr-2 inline size-4" />
                    ) : (
                      <CreditCard className="mr-2 inline size-4" />
                    )}
                    <span className="block text-[13px] font-medium">{m.label}</span>
                  </div>
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
          {[5000, 10000, 20000, 50000].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className="flex-1 rounded-xl border border-border bg-card py-2 text-xs font-medium"
            >
              ₦{v.toLocaleString("en-US")}
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