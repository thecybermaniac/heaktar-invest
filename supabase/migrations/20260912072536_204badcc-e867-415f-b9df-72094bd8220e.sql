CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users mark their own notifications read" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own push subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_transaction_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_title text;
  notification_body text;
BEGIN
  notification_title := CASE NEW.type
    WHEN 'deposit' THEN 'Deposit received'
    WHEN 'withdrawal' THEN 'Withdrawal requested'
    WHEN 'investment' THEN 'Investment started'
    WHEN 'payout' THEN CASE WHEN NEW.reference LIKE 'maturity_%' THEN 'Investment matured' ELSE 'Profit paid' END
    WHEN 'referral' THEN 'Referral reward received'
    ELSE 'Transaction update'
  END;

  notification_body := CASE NEW.type
    WHEN 'deposit' THEN 'Your wallet was credited successfully.'
    WHEN 'withdrawal' THEN 'Your withdrawal request is being processed.'
    WHEN 'investment' THEN COALESCE(NEW.label, 'Your investment is now active.')
    WHEN 'payout' THEN COALESCE(NEW.label, 'A payout has been added to your wallet.')
    WHEN 'referral' THEN COALESCE(NEW.label, 'Your referral reward has been added to your wallet.')
    ELSE COALESCE(NULLIF(NEW.label, ''), 'Your transaction was recorded.')
  END;

  INSERT INTO public.notifications (user_id, transaction_id, type, title, body)
  VALUES (NEW.user_id, NEW.id, NEW.type, notification_title, notification_body);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_transaction_created() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_transaction_created() TO service_role;

CREATE TRIGGER transactions_create_notification
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_transaction_created();

CREATE OR REPLACE FUNCTION public.set_push_subscription_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER push_subscriptions_set_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_push_subscription_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;