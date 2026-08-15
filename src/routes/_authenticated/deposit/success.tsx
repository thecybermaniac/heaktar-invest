import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, PageHeader } from "@/components/hk/ui";
import { money } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/deposit/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: search["reference"] as string | undefined,
    amount: search["amount"] ? Number(search["amount"]) : undefined,
  }),
  component: DepositSuccess,
});

function DepositSuccess() {
  const { reference, amount } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <Screen>
      <PageHeader title="Deposit successful" subtitle="Your wallet has been credited" />
      <div className="space-y-4 px-5 pt-5">
        <Card className="bg-card flex flex-col items-center">
          <div className="mb-3 grid size-16 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-8" strokeWidth={3} />
          </div>
          <h1 className="text-lg font-medium mb-2">Deposit Successful</h1>
          <p className="text-xs text-center text-muted-foreground mb-8">
            Your account deposit was successful.{" "}
            <span className="font-semibold text-foreground">{amount && money(amount)}</span> has
            been credited to your wallet.
          </p>
          {reference && (
            <p className="mt-1 text-[11px] text-foreground">
              Reference: <span className="text-muted-foreground">{reference}</span>
            </p>
          )}
        </Card>
        <div className="mt-8 flex gap-3">
          <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })} className="w-28">
            Home
          </Button>
          <Button full onClick={() => navigate({ to: "/deposit" })}>
            Add more funds
          </Button>
        </div>
      </div>
    </Screen>
  );
}
