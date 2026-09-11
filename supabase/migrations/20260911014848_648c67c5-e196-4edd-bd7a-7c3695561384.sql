DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'heaktar-daily-investment-accrual'
  ) THEN
    PERFORM cron.schedule(
      'heaktar-daily-investment-accrual',
      '0 5 * * *',
      'SELECT public.accrue_daily_investment_profits();'
    );
  END IF;
END
$$;