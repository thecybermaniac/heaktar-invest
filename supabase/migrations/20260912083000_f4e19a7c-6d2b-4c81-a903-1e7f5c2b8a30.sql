-- Push delivery layer on top of Lovable's notifications/push_subscriptions tables.
-- pg_net lets Postgres fire an async, non-blocking HTTP call straight from a trigger —
-- no app-code changes needed, and it covers the cron-driven daily payout notifications
-- the same way it covers everything else, since they all flow through the same table.
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fires right after Lovable's notify_transaction_created() trigger inserts a row, and
-- asynchronously invokes the send-push edge function, which fans it out to every device
-- the user has subscribed from. No-ops safely (does not raise) if the project URL /
-- service key haven't been configured yet — see the setup note in the migration README —
-- so a missing configuration never blocks a transaction or a notification insert.
CREATE OR REPLACE FUNCTION public.dispatch_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text := current_setting('app.settings.supabase_url', true);
  v_key text := current_setting('app.settings.service_role_key', true);
BEGIN
  IF v_url IS NULL OR v_url = '' OR v_key IS NULL OR v_key = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', NEW.body,
      'notification_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_push_notification() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER notifications_dispatch_push
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_notification();
