import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, MonthPicker, PageHeader } from "@/components/hk/ui";
import { money } from "@/lib/data";
import { fetchAccountCreatedAt, fetchStatementTransactions } from "@/lib/transactions.functions";
import { toast } from "@/components/hk/toast";

export const Route = createFileRoute("/_authenticated/profile/statement")({
  head: () => ({
    meta: [
      { title: "Account Statement — Heaktar" },
      {
        name: "description",
        content: "Download a CSV statement of your Heaktar transactions for any month range.",
      },
      { property: "og:title", content: "Account Statement — Heaktar" },
      { property: "og:description", content: "Download a CSV of your account activity." },
    ],
  }),
  component: AccountStatement,
});

function currentMonthIso() {
  return new Date().toISOString().slice(0, 7);
}

// First day of the given "YYYY-MM" month, as an ISO date.
function monthStartIso(month: string) {
  return `${month}-01`;
}

// Last day of the given "YYYY-MM" month, as an ISO date.
function monthEndIso(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(y, m, 0).toISOString().slice(0, 10);
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function AccountStatement() {
  const fetchStatement = useServerFn(fetchStatementTransactions);
  const fetchCreatedAt = useServerFn(fetchAccountCreatedAt);

  const [minMonth, setMinMonth] = useState<string | null>(null);
  const nowMonth = currentMonthIso();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState(nowMonth);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<{ count: number; net: number } | null>(null);

  // Bound the picker to the account's actual lifetime — no point offering months before
  // the account existed.
  useEffect(() => {
    let cancelled = false;
    fetchCreatedAt()
      .then((createdAt) => {
        if (cancelled) return;
        const bound = createdAt.slice(0, 7);
        setMinMonth(bound);
        setFrom((f) => f || bound);
      })
      .catch(() => !cancelled && setMinMonth(nowMonth));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canGenerate = !!from && !!to && from <= to && !generating;

  async function handleDownload() {
    if (!canGenerate) return;
    setGenerating(true);
    setSummary(null);
    try {
      const rows = await fetchStatement({
        data: { from: monthStartIso(from), to: monthEndIso(to) },
      });

      if (rows.length === 0) {
        toast.error("No transactions found", "There's nothing in that range to export.");
        return;
      }

      const header = ["Date", "Type", "Description", "Amount", "Status"];
      const lines = rows.map((r) =>
        [
          new Date(r.date).toLocaleString("en-US"),
          r.type,
          csvEscape(r.label),
          r.amount.toFixed(2),
          r.status,
        ].join(","),
      );
      const csv = [header.join(","), ...lines].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heaktar-statement-${from}-to-${to}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setSummary({ count: rows.length, net: rows.reduce((s, r) => s + r.amount, 0) });
      toast.success(
        "Statement downloaded",
        `${rows.length} transaction${rows.length === 1 ? "" : "s"} exported.`,
      );
    } catch (err) {
      toast.error(
        "Couldn't generate statement",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Account Statement" subtitle="Download your activity as a CSV" />
      <div className="space-y-4 px-5 pt-5">
        <div className="grid grid-cols-2 gap-3">
          <MonthPicker
            label="From"
            value={from}
            onChange={setFrom}
            minMonth={minMonth ?? undefined}
            maxMonth={nowMonth}
          />
          <MonthPicker
            label="To"
            value={to}
            onChange={setTo}
            minMonth={minMonth ?? undefined}
            maxMonth={nowMonth}
          />
        </div>

        {summary && (
          <Card className="border-primary/30 bg-accent/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Transactions in range</span>
              <span className="font-medium">{summary.count}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Net movement</span>
              <span className="font-semibold">{money(summary.net)}</span>
            </div>
          </Card>
        )}

        <Button full disabled={!canGenerate} onClick={handleDownload}>
          <Download className="size-4" />
          {generating ? "Generating…" : "Download CSV"}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Includes deposits, withdrawals, investments, payouts and referral bonuses in the selected
          months.
        </p>
      </div>
    </Screen>
  );
}
