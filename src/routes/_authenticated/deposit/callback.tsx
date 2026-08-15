import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Screen } from "@/components/hk/shell";
import { PageHeader } from "@/components/hk/ui";
import { checkDepositStatus } from "@/lib/paystack.server";

export const Route = createFileRoute("/_authenticated/deposit/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: (search["reference"] ?? search["trxref"]) as string,
  }),
  component: DepositCallback,
});

function DepositCallback() {
  const { reference } = Route.useSearch();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || !reference) return;
    hasRun.current = true;

    checkDepositStatus({ data: { reference } })
      .then((result) => {
        if (result.success) {
          navigate({
            to: "/deposit/success",
            search: { reference: result.reference, amount: result.amount },
            replace: true,
          });
        } else {
          navigate({ to: "/deposit", search: { error: "payment_failed" }, replace: true });
        }
      })
      .catch(() => {
        navigate({ to: "/deposit", search: { error: "verification_failed" }, replace: true });
      });
  }, [reference, navigate]);

  return (
    <Screen>
      <PageHeader title="Confirming deposit" subtitle="Please wait…" />
      <div className="grid place-items-center px-5 pt-16">
        <p className="text-[13px] text-muted-foreground">Verifying your payment with Paystack…</p>
      </div>
    </Screen>
  );
}
