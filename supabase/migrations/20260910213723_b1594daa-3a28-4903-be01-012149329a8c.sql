CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.accrue_daily_investment_profits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  investment_row public.investments%ROWTYPE;
  local_today date := (now() AT TIME ZONE 'Africa/Lagos')::date;
  first_due_date date;
  last_due_date date;
  due_date date;
BEGIN
  FOR investment_row IN
    SELECT *
    FROM public.investments
    WHERE status = 'active'
    FOR UPDATE
  LOOP
    first_due_date := (investment_row.started_at AT TIME ZONE 'Africa/Lagos')::date + 1;
    last_due_date := first_due_date + investment_row.term_days - 1;

    IF local_today >= first_due_date THEN
      FOR due_date IN
        SELECT day_value::date
        FROM generate_series(
          first_due_date,
          LEAST(local_today, last_due_date),
          interval '1 day'
        ) AS day_value
      LOOP
        INSERT INTO public.transactions (
          user_id,
          type,
          label,
          amount,
          status,
          reference,
          investment_id,
          created_at
        ) VALUES (
          investment_row.user_id,
          'payout',
          'Daily profit — ' || investment_row.plan_name,
          investment_row.daily_return,
          'completed',
          'profit_' || investment_row.id::text || '_' || to_char(due_date, 'YYYY-MM-DD'),
          investment_row.id,
          (due_date::timestamp AT TIME ZONE 'Africa/Lagos') + interval '6 hours'
        )
        ON CONFLICT (reference) DO NOTHING;
      END LOOP;
    END IF;

    IF local_today >= last_due_date THEN
      INSERT INTO public.transactions (
        user_id,
        type,
        label,
        amount,
        status,
        reference,
        investment_id
      ) VALUES (
        investment_row.user_id,
        'payout',
        'Principal returned — ' || investment_row.plan_name,
        investment_row.amount,
        'completed',
        'maturity_' || investment_row.id::text,
        investment_row.id
      )
      ON CONFLICT (reference) DO NOTHING;

      UPDATE public.investments
      SET status = 'completed', completed_at = now()
      WHERE id = investment_row.id AND status = 'active';
    END IF;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accrue_daily_investment_profits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accrue_daily_investment_profits() TO service_role;