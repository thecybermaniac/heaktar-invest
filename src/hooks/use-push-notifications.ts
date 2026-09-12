import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

// Matches the VAPID keypair set as the send-push edge function's secrets. Only the
// public half ever needs to live in client code.
const VAPID_PUBLIC_KEY = "BF23_O9QKL9Wg7cUK4abCxF3pmH-hXUbRcXcpRIfuemMqIAmpBL7lOo91-_5xdWmAzKOJCCiB8S1Nlr8dly85pg";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export type PushStatus = "unsupported" | "denied" | "unsubscribed" | "subscribed";

export function usePushNotifications() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushStatus>("unsubscribed");
  const [busy, setBusy] = useState(false);

  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  useEffect(() => {
    if (!supported || !user) return;
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    (async () => {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "unsubscribed");
    })();
  }, [supported, user]);

  const subscribe = useCallback(async () => {
    if (!supported || !user) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const raw = subscription.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: raw.endpoint!,
          p256dh: raw.keys!.p256dh,
          auth: raw.keys!.auth,
        } as never,
        { onConflict: "endpoint" },
      );
      if (error) throw error;
      setStatus("subscribed");
    } finally {
      setBusy(false);
    }
  }, [supported, user]);

  const unsubscribe = useCallback(async () => {
    if (!supported || !user) return;
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } finally {
      setBusy(false);
    }
  }, [supported, user]);

  return { status: supported ? status : ("unsupported" as PushStatus), busy, subscribe, unsubscribe };
}
