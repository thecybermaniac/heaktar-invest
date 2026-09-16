import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Check, ChevronDown, Hash, Search } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, Field, PageHeader } from "@/components/hk/ui";
import { resolveBankAccount } from "@/lib/paystack.functions";
import { saveWithdrawalMethod } from "@/lib/withdrawals.functions";
import { useBanks, useRefreshWithdrawalMethod, useWithdrawalMethod } from "@/hooks/use-withdrawal";
import { useApp } from "@/lib/app-store";
import { namesLikelyMatch } from "@/lib/name-match";
import { toast } from "@/components/hk/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/withdraw/method")({
  head: () => ({
    meta: [
      { title: "Withdrawal method — Heaktar" },
      {
        name: "description",
        content: "Add the Nigerian bank account you want your Heaktar withdrawals paid into.",
      },
      { property: "og:title", content: "Withdrawal method — Heaktar" },
      { property: "og:description", content: "Add your payout bank account." },
    ],
  }),
  component: WithdrawalMethod,
});

type Bank = { code: string; name: string };

function BankPicker({
  banks,
  loading,
  value,
  onChange,
}: {
  banks: Bank[];
  loading: boolean;
  value: Bank | null;
  onChange: (bank: Bank) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [banks, query]);

  return (
    <div ref={ref} className="relative">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Bank</span>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center gap-2 rounded border bg-input px-3 text-left text-[15px] transition-colors disabled:opacity-60",
          open ? "border-primary bg-card" : "border-transparent",
        )}
      >
        <Building2 className="size-4.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
        <span className={cn("flex-1 truncate", !value && "text-muted-foreground/70")}>
          {loading ? "Loading banks…" : (value?.name ?? "Select your bank")}
        </span>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded border border-border bg-popover shadow-float">
          <div className="flex h-11 items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search banks"
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No banks match that.</p>
            )}
            {filtered.map((bank) => (
              <button
                key={bank.code}
                type="button"
                onClick={() => {
                  onChange(bank);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-sm hover:bg-muted"
              >
                <span className="truncate">{bank.name}</span>
                {value?.code === bank.code && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawalMethod() {
  const navigate = useNavigate();
  const { profile } = useApp();
  const { data: banks, isPending: banksLoading, isError: banksError } = useBanks();
  const { data: existing } = useWithdrawalMethod();
  const refreshMethod = useRefreshWithdrawalMethod();
  const resolve = useServerFn(resolveBankAccount);
  const save = useServerFn(saveWithdrawalMethod);

  const [bank, setBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const profileName = `${profile.firstName} ${profile.lastName}`.trim();
  const nameMismatch =
    !!accountName && !resolving && profileName ? !namesLikelyMatch(profileName, accountName) : false;
  const canSave = !!bank && !!accountName && !resolving && !saving && !nameMismatch;

  // prefill from the saved method so this doubles as the "update" screen
  useEffect(() => {
    if (!existing) return;
    setBank({ code: existing.bankCode, name: existing.bankName });
    setAccountNumber(existing.accountNumber);
    setAccountName(existing.accountName);
  }, [existing]);

  // verify with Paystack as soon as we have a bank + 10 digits
  useEffect(() => {
    if (!bank || accountNumber.length !== 10) {
      setAccountName("");
      setResolveError(undefined);
      return;
    }
    let cancelled = false;
    setResolving(true);
    setResolveError(undefined);
    resolve({ data: { accountNumber, bankCode: bank.code } })
      .then((res) => {
        if (!cancelled) setAccountName(res.accountName);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setAccountName("");
        setResolveError(err instanceof Error ? err.message : "Could not verify that account");
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bank, accountNumber, resolve]);

  async function handleSave() {
    if (!bank || !accountName || saving || nameMismatch) return;
    setSaving(true);
    try {
      await save({
        data: { bankCode: bank.code, bankName: bank.name, accountNumber, accountName },
      });
      await refreshMethod();
      toast.success("Withdrawal method saved", `${bank.name} ••${accountNumber.slice(-4)}`);
      navigate({ to: "/withdraw" });
    } catch (err) {
      toast.error("Couldn't save", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <PageHeader
        title={existing ? "Update withdrawal method" : "Add withdrawal method"}
        subtitle="Where your withdrawals get paid"
      />
      <div className="space-y-4 px-5 pt-5">
        <BankPicker
          banks={banks ?? []}
          loading={banksLoading}
          value={bank}
          onChange={(b) => setBank(b)}
        />
        {banksError && (
          <p className="text-[11px] text-destructive">
            Couldn't load the bank list. Check your connection and try again.
          </p>
        )}

        <Field
          icon={Hash}
          label="Account number"
          inputMode="numeric"
          placeholder="0123456789"
          maxLength={10}
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
          error={resolveError}
          hint={!resolveError && accountNumber.length > 0 && accountNumber.length < 10 ? "10 digits" : undefined}
        />

        {(resolving || accountName) && (
          <Card className={cn(accountName && (nameMismatch ? "border-destructive bg-destructive/5" : "border-primary bg-accent/40"))}>
            <span className="block text-xs text-muted-foreground">Account name</span>
            <p className="mt-0.5 text-[15px] font-semibold">
              {resolving ? "Verifying…" : accountName}
            </p>
            {nameMismatch && (
              <p className="mt-2 text-[11px] text-destructive">
                This doesn't look like your name on file ({profileName}). For your security,
                withdrawal accounts must belong to you — use an account in your own name, or
                update your profile name if it's out of date.
              </p>
            )}
          </Card>
        )}

        <Button
          full
          disabled={!canSave}
          onClick={handleSave}
        >
          {saving ? "Saving…" : existing ? "Update method" : "Save method"}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          The account name is verified with your bank and can't be edited by hand.
        </p>
      </div>
    </Screen>
  );
}
