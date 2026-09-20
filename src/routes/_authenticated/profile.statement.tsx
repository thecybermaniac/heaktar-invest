import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { Download } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, MonthPicker, PageHeader } from "@/components/hk/ui";
import { money } from "@/lib/data";
import {
  fetchAccountCreatedAt,
  fetchStatementHeaderInfo,
  fetchStatementTransactions,
} from "@/lib/transactions.functions";
import { toast } from "@/components/hk/toast";

export const Route = createFileRoute("/_authenticated/profile/statement")({
  head: () => ({
    meta: [
      { title: "Account Statement — Heaktar" },
      {
        name: "description",
        content: "Download a PDF statement of your Heaktar transactions for any month range.",
      },
      { property: "og:title", content: "Account Statement — Heaktar" },
      { property: "og:description", content: "Download a PDF of your account activity." },
    ],
  }),
  component: AccountStatement,
});

const COMPANY_NAME = "Heaktar Nigeria Investments Limited";

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

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// jsPDF's built-in fonts don't include the ₦ glyph (it would render as a broken box), so the
// PDF specifically uses "NGN" — the app's own ₦ display elsewhere is plain HTML and unaffected.
function formatNaira(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}NGN ${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function AccountStatement() {
  const fetchStatement = useServerFn(fetchStatementTransactions);
  const fetchCreatedAt = useServerFn(fetchAccountCreatedAt);
  const fetchHeaderInfo = useServerFn(fetchStatementHeaderInfo);

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
      const [rows, header] = await Promise.all([
        fetchStatement({ data: { from: monthStartIso(from), to: monthEndIso(to) } }),
        fetchHeaderInfo(),
      ]);

      if (rows.length === 0) {
        toast.error("No transactions found", "There's nothing in that range to export.");
        return;
      }

      const net = rows.reduce((s, r) => s + r.amount, 0);
      const period = from === to ? monthLabel(from) : `${monthLabel(from)} – ${monthLabel(to)}`;

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;

      // Header: company name as the document title, then statement meta.
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(COMPANY_NAME, pageWidth / 2, 50, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Account Statement", pageWidth / 2, 68, { align: "center" });

      doc.setDrawColor(200);
      doc.line(margin, 82, pageWidth - margin, 82);

      doc.setFontSize(10);
      let y = 102;
      const detailLine = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, margin + 110, y);
        y += 16;
      };
      detailLine("Customer Name:", header.customerName);
      detailLine("Statement Period:", period);
      detailLine("Current Account Balance:", formatNaira(header.balance));
      detailLine(
        "Generated On:",
        new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
      );

      autoTable(doc, {
        startY: y + 10,
        margin: { left: margin, right: margin },
        head: [["Date", "Type", "Description", "Amount", "Status"]],
        body: rows.map((r) => [
          new Date(r.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
          r.type.charAt(0).toUpperCase() + r.type.slice(1),
          r.label,
          formatNaira(r.amount),
          r.status.charAt(0).toUpperCase() + r.status.slice(1),
        ]),
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 6 },
        columnStyles: { 3: { halign: "right" } },
        alternateRowStyles: { fillColor: [246, 248, 247] },
      });

      // Net total, directly under the table.
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
      const totalsY = finalY + 24;
      doc.setDrawColor(200);
      doc.line(margin, totalsY - 16, pageWidth - margin, totalsY - 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Net Total:", pageWidth - margin - 140, totalsY);
      doc.text(formatNaira(net), pageWidth - margin, totalsY, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(
        "This is a system-generated statement and does not require a signature.",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 30,
        { align: "center" },
      );

      doc.save(`heaktar-statement-${from}-to-${to}.pdf`);

      setSummary({ count: rows.length, net });
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
      <PageHeader title="Account Statement" subtitle="Download your activity as a PDF" />
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
          {generating ? "Generating…" : "Download PDF"}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Includes deposits, withdrawals, investments, payouts and referral bonuses in the selected
          months.
        </p>
      </div>
    </Screen>
  );
}
