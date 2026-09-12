# Finishing push notification setup

Everything that can be written as code is done. Three things need your Supabase project
credentials, which I don't have access to, so they have to be run by you (via the
Supabase dashboard or CLI):

## 1. Set the edge function secrets

```
supabase secrets set VAPID_PUBLIC_KEY=BF23_O9QKL9Wg7cUK4abCxF3pmH-hXUbRcXcpRIfuemMqIAmpBL7lOo91-_5xdWmAzKOJCCiB8S1Nlr8dly85pg
supabase secrets set VAPID_PRIVATE_KEY=AsiZ84jK2GiP0WBOsmZb6Xb9WqAlqMuIRs4eAP-smCk
supabase secrets set VAPID_SUBJECT=mailto:support@heaktar.app
```

This is a real, freshly generated VAPID keypair — safe to use as-is, or regenerate your
own with `npx web-push generate-vapid-keys` and swap both the private key here and the
public key in `src/hooks/use-push-notifications.ts`. If you regenerate, keep the two in
sync — the public key in the app must match the private key the edge function signs with.

## 2. Deploy the edge function

```
supabase functions deploy send-push
```

## 3. Let Postgres call the function

The `dispatch_push_notification()` trigger reads the project URL and service role key from
Postgres config, so it never has secrets hard-coded in the migration file. Run this once
in the SQL editor (or via `psql`), filling in your actual project ref and service role key
(Project Settings → API):

```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://<your-project-ref>.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = '<your-service-role-key>';
```

Until this is set, the trigger silently no-ops — notifications still get created and show
up live in the app, they just won't push to a device yet.

## Then apply the migrations

```
supabase db push
```

This runs both the pg_net/dispatch-trigger migration and picks up anything else pending.

## Testing

Push notifications need HTTPS and a real service worker, so this won't work on
`localhost` in most browsers — test on a deployed preview URL. Open the app, go to
Notifications, tap "Turn on push notifications," accept the browser permission prompt,
then trigger any transaction (a deposit, for instance) and you should get a system
notification even with the tab closed.
