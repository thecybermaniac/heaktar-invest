import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, Gift, ShieldCheck, TrendingUp } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { PageHeader } from "@/components/hk/ui";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/hooks/use-notifications";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
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

function PushToggle() {
  const { status, busy, subscribe, unsubscribe } = usePushNotifications();

  if (status === "unsupported") return null;

  if (status === "denied") {
    return (
      <p className="mx-4 mt-4 rounded border border-border bg-card p-3 text-xs text-muted-foreground">
        Push notifications are blocked in your browser settings. Enable them for this site to get alerts when
        the app is closed.
      </p>
    );
  }

  return (
    <button
      onClick={() => (status === "subscribed" ? unsubscribe() : subscribe())}
      disabled={busy}
      className="mx-4 mt-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded border border-border bg-card p-3.5 text-left disabled:opacity-60"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
        {status === "subscribed" ? <Bell className="size-4.5" strokeWidth={1.9} /> : <BellOff className="size-4.5" strokeWidth={1.9} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium">
          {status === "subscribed" ? "Push notifications on" : "Turn on push notifications"}
        </span>
        <span className="block text-xs text-muted-foreground">
          {status === "subscribed" ? "Tap to turn off for this device." : "Get alerts even when the app is closed."}
        </span>
      </span>
    </button>
  );
}

function Notifications() {
  const { data, isPending } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const items = data ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <Screen>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread`}
        action={
          <button className="text-xs font-medium text-primary" onClick={() => markAllRead()}>
            Mark all read
          </button>
        }
      />
      <PushToggle />
      <div className="space-y-2 px-4 pt-4">
        {isPending && <p className="px-1 py-6 text-center text-xs text-muted-foreground">Loading…</p>}
        {!isPending && items.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
        )}
        {items.map((n) => {
          const Icon = ICONS[n.kind];
          return (
            <button
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
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
