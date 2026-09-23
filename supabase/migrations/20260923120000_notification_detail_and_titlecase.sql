-- Richer notification copy:
--   1. Titles are now Title Case ("Deposit Received" instead of "Deposit received").
--   2. Bodies include the amount and a short "why" — which plan, day X of Y, days left
--      until maturity, or the maturity date — pulled from the linked investment row
--      when NEW.investment_id is set (investment + payout transactions always set it;
--      deposit/withdrawal/referral don't, so those bodies stay amount-only).
-- Replaces the notify_transaction_created() from 20260912072536_*.sql. Trigger wiring,
-- grants and the notifications_dispatch_push trigger downstream are unaffected.

CREATE OR REPLACE FUNCTION public.notify_transaction_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_title text;
  notification_body text;
  inv public.investments%ROWTYPE;
  amount_str text;
  maturity_date date;
  day_number integer;
  days_remaining integer;
  referrer_name text;
BEGIN
  amount_str := '₦' || to_char(abs(NEW.amount), 'FM999,999,999,990.00');

  IF NEW.investment_id IS NOT NULL THEN
    SELECT * INTO inv FROM public.investments WHERE id = NEW.investment_id;
  END IF;

  IF inv.id IS NOT NULL THEN
    maturity_date := (inv.started_at AT TIME ZONE 'Africa/Lagos')::date + inv.term_days;
    day_number := LEAST(
      GREATEST(((now() AT TIME ZONE 'Africa/Lagos')::date - (inv.started_at AT TIME ZONE 'Africa/Lagos')::date), 1),
      inv.term_days
    );
    days_remaining := GREATEST(maturity_date - (now() AT TIME ZONE 'Africa/Lagos')::date, 0);
  END IF;

  referrer_name := NULLIF(split_part(COALESCE(NEW.label, ''), ' — ', 2), '');

  notification_title := CASE NEW.type
    WHEN 'deposit' THEN 'Deposit Received'
    WHEN 'withdrawal' THEN 'Withdrawal Requested'
    WHEN 'investment' THEN 'Investment Started'
    WHEN 'payout' THEN CASE WHEN NEW.reference LIKE 'maturity_%' THEN 'Investment Matured' ELSE 'Profit Paid' END
    WHEN 'referral' THEN 'Referral Reward Received'
    ELSE 'Transaction Update'
  END;

  notification_body := CASE NEW.type
    WHEN 'deposit' THEN
      amount_str || ' has been credited to your wallet and is ready to invest or withdraw.'

    WHEN 'withdrawal' THEN
      'Your withdrawal of ' || amount_str || ' is being processed and typically completes within 24 hours.'

    WHEN 'investment' THEN
      amount_str || ' is now invested in the ' || COALESCE(inv.plan_name, 'selected') || ' plan for ' ||
      COALESCE(inv.term_days::text, '—') || ' day(s), maturing on ' ||
      COALESCE(to_char(maturity_date, 'Mon DD, YYYY'), 'the scheduled date') || '.'

    WHEN 'payout' THEN
      CASE
        WHEN NEW.reference LIKE 'maturity_%' THEN
          'Your ' || COALESCE(inv.plan_name, '') || ' plan matured today. The ' || amount_str ||
          ' principal has been returned to your wallet.'
        ELSE
          amount_str || ' in daily profit from your ' || COALESCE(inv.plan_name, '') || ' plan has been added to your wallet' ||
          CASE
            WHEN inv.id IS NOT NULL AND days_remaining > 0 THEN
              ' — day ' || day_number || ' of ' || inv.term_days || ', ' || days_remaining ||
              CASE WHEN days_remaining = 1 THEN ' day' ELSE ' days' END ||
              ' left until it matures on ' || to_char(maturity_date, 'Mon DD, YYYY') || '.'
            WHEN inv.id IS NOT NULL THEN
              ' — day ' || day_number || ' of ' || inv.term_days || '. It matures today.'
            ELSE '.'
          END
      END

    WHEN 'referral' THEN
      'You earned ' || amount_str || ' in referral reward' ||
      CASE WHEN referrer_name IS NOT NULL THEN ' because ' || referrer_name || ' made their first investment.'
           ELSE '.' END

    ELSE
      COALESCE(NULLIF(NEW.label, ''), 'A transaction of ' || amount_str || ' was recorded on your account.')
  END;

  INSERT INTO public.notifications (user_id, transaction_id, type, title, body)
  VALUES (NEW.user_id, NEW.id, NEW.type, notification_title, notification_body);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_transaction_created() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_transaction_created() TO service_role;
