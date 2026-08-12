import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, StatusPill } from "@/components/hk/ui";
import { REFERRALS, money } from "@/lib/data";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/_authenticated/referral")({
  head: () => ({
    meta: [
      { title: "Referrals — Heaktar" },
      {
        name: "description",
        content:
          "Share your Heaktar code, track invited friends and earn 5% of every referral's first investment.",
      },
      { property: "og:title", content: "Referrals — Heaktar" },
      { property: "og:description", content: "Earn 5% of every referral's first investment." },
    ],
  }),
  component: Referral,
});

function Referral() {
  const { profile } = useApp();
  const [copied, setCopied] = useState(false);
  const link = `https://heaktar.app/r/${profile.referralCode}`;
  const totalEarned = REFERRALS.reduce((s, r) => s + r.earned, 0);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Heaktar",
          text: "Invest and earn daily.",
          url: link,
        });
        return;
      } catch {
        /* dismissed */
      }
    }
    copy();
  };

  return (
    <Screen>
      <header className="px-5 pt-6">
        <h1 className="text-xl font-semibold">Refer & earn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn 5% of every friend's first investment — paid instantly.
        </p>
      </header>

      <div className="px-5 pt-5">
        <div className="rounded bg-card p-5 text-primary-foreground shadow-float">
          <span className="text-xs text-muted-foreground">Your referral code</span>
          <p className="mt-1 text-3xl font-semibold tracking-[0.14em]">{profile.referralCode}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={copy}
              className="flex h-11 items-center justify-center gap-2 rounded bg-muted dark:bg-white/12 text-xs font-medium"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              onClick={share}
              className="flex h-11 items-center justify-center gap-2 rounded bg-muted dark:bg-white/15 text-xs font-medium"
            >
              <Share2 className="size-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 pt-4">
        <Card className="p-3.5 text-center">
          <p className="mt-1 text-xl font-semibold">{REFERRALS.length}</p>
          <span className="text-xs text-muted-foreground">Referrals</span>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="mt-1 text-xl font-semibold text-success">{money(totalEarned, 0)}</p>
          <span className="text-xs text-muted-foreground">Earned</span>
        </Card>
      </div>

      <section className="px-5 pt-6">
        <h2 className="mb-3 text-sm font-medium">Referred Users</h2>
        <div className="space-y-2">
          {REFERRALS.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded border border-border bg-card p-3.5"
            >
              <span className="grid size-10 place-items-center rounded-full bg-muted text-xs font-semibold">
                {r.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{r.name}</p>
                <p className="text-[11px] text-muted-foreground">Joined {r.joined}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[13px] font-semibold text-success">
                  +{money(r.earned)}
                </span>{" "}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Screen>
  );
}
