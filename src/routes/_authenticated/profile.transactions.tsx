import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/hk/shell";
import { Button, Chips, PageHeader, StatusPill } from "@/components/hk/ui";
import { money } from "@/lib/data";
import { useTransactionHistory } from "@/hooks/use-transaction-history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile/transactions")({
  head: () => ({
    meta: [
      { title: "Transaction History — Heaktar Nigeria" },
      {
        name: "description",
        content:
          "Every deposit, withdrawal, investment, payout and referral bonus on your Heaktar account.",
      },
      { property: "og:title", content: "Transaction History — Heaktar Nigeria" },
      { property: "og:description", content: "Your full Heaktar transaction history." },
    ],
  }),
  component: TransactionHistory,
});

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "investment", label: "Investments" },
  { value: "payout", label: "Payouts" },
  { value: "referral", label: "Referrals" },
];

function statusTone(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "pending") return "warning" as const;
  return "muted" as const;
}

function TransactionHistory() {
  const [type, setType] = useState("all");
  const { rows, isPending, isLoadingMore, isError, hasMore, loadMore } =
    useTransactionHistory(type);
  const typeLabel = TYPE_OPTIONS.find((t) => t.value === type)?.label ?? "All";

  return (
    <Screen>
      <PageHeader title="Transaction History" subtitle="Every transaction on your account" />
      <div className="px-5 pt-4">
        <Chips
          value={typeLabel}
          onChange={(label) => setType(TYPE_OPTIONS.find((t) => t.label === label)?.value ?? "all")}
          options={TYPE_OPTIONS.map((t) => t.label)}
        />
      </div>

      <div className="space-y-2 px-5 pt-4">
        {isPending && (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">Loading…</p>
        )}
        {isError && !isPending && (
          <p className="px-1 py-6 text-center text-xs text-destructive">
            Couldn't load your transactions. Pull down or try again shortly.
          </p>
        )}
        {!isPending && !isError && rows.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">
            No transactions yet.
          </p>
        )}

        {rows.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 rounded border border-border bg-card p-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{t.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {new Date(t.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className={cn(
                  "text-[13px] font-semibold",
                  t.amount >= 0 ? "text-success" : "text-foreground",
                )}
              >
                {t.amount >= 0 ? "+" : ""}
                {money(t.amount)}
              </span>
              <StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill>
            </div>
          </div>
        ))}

        {hasMore && !isPending && (
          <Button variant="outline" full disabled={isLoadingMore} onClick={loadMore}>
            {isLoadingMore ? "Loading…" : "Load more"}
          </Button>
        )}
      </div>
    </Screen>
  );
}
