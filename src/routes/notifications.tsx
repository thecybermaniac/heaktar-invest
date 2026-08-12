import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Gift, ShieldCheck, TrendingUp } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { PageHeader } from "@/components/hk/ui";
import { NOTIFICATIONS } from "@/lib/data";
import { useApp } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Heaktar" },
      { name: "description", content: "Payout alerts, referral bonuses, withdrawal updates and security notices from your Heaktar account." },
      { property: "og:title", content: "Notifications — Heaktar" },
      { property: "og:description", content: "Payout, referral, withdrawal and security alerts." },
    ],
  }),
  component: Notifications,
});

const ICONS = { payout: TrendingUp, referral: Gift, security: ShieldCheck, system: Bell };

function Notifications() {
  const { markAllRead } = useApp();
  const [items, setItems] = useState(NOTIFICATIONS);

  return (
    <Screen>
      <PageHeader
        title="Notifications"
        subtitle={`${items.filter((n) => !n.read).length} unread`}
        action={
          <button
            className="text-xs font-medium text-primary"
            onClick={() => {
              setItems((prev) => prev.map((n) => ({ ...n, read: true })));
              markAllRead();
            }}
          >
            Mark all read
          </button>
        }
      />
      <div className="space-y-2 px-5 pt-4">
        {items.map((n) => {
          const Icon = ICONS[n.kind];
          return (
            <button
              key={n.id}
              onClick={() => setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
              className={cn(
                "flex w-full gap-3 rounded border p-4 text-left transition-colors",
                n.read ? "border-border bg-card" : "border-primary/40 bg-accent/30",
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full",
                  n.read ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
                )}
              >
                <Icon className="size-4.5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold">{n.title}</span>
                  {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{n.body}</span>
                <span className="mt-1 block text-[10px] text-muted-foreground">{n.time}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}
