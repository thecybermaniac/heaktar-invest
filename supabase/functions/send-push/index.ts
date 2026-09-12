// Sends a Web Push notification to every device a user has subscribed from.
// Invoked by the `notifications_dispatch_push` Postgres trigger (via pg_net) right after
// a row lands in `public.notifications`.
//
// Required function secrets (set with `supabase secrets set`):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. "mailto:you@heaktar.app")
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are already present on every project.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@heaktar.app";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

interface PushPayload {
  user_id: string;
  title: string;
  body?: string;
  notification_id?: string;
}

Deno.serve(async (req: Request) => {
  let payload: PushPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const { user_id, title, body, notification_id } = payload;
  if (!user_id || !title) {
    return new Response(JSON.stringify({ error: "user_id and title are required" }), { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", user_id);

  if (error) {
    console.error("failed to load push subscriptions", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, total: 0 }), { status: 200 });
  }

  const message = JSON.stringify({
    title,
    body: body ?? "",
    notification_id: notification_id ?? null,
    url: "/notifications",
  });

  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message,
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone — permission revoked, app uninstalled, etc. Clean it up
          // so we stop paying the cost of a doomed send on every future notification.
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("push send failed", sub.id, err);
        }
      }
    }),
  );

  return new Response(JSON.stringify({ sent, total: subs.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
