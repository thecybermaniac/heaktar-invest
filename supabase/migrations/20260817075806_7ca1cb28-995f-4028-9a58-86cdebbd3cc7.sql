CREATE TABLE public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  daily_interest numeric NOT NULL,
  term_days integer NOT NULL,
  min_amount numeric NOT NULL,
  max_amount numeric NOT NULL,
  total_return numeric NOT NULL,
  deposit_returned boolean NOT NULL DEFAULT true,
  tagline text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plans TO anon;
GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are publicly readable" ON public.plans FOR SELECT TO anon, authenticated USING (active);

INSERT INTO public.plans (id, name, daily_interest, term_days, min_amount, max_amount, total_return, deposit_returned, tagline, sort_order) VALUES
  ('starter','Starter',1.2,15,50,999,18,true,'Dip your toes in with a short, low-commitment cycle.',1),
  ('silver','Silver',1.6,30,1000,4999,48,true,'Balanced monthly yield for steady portfolio growth.',2),
  ('diamond','Diamond',2.1,45,5000,19999,94.5,true,'Higher daily payouts for committed investors.',3),
  ('platinum','Platinum',2.8,60,20000,100000,168,true,'Our flagship tier with priority desk support.',4);

CREATE TABLE public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.plans(id),
  plan_name text NOT NULL,
  amount numeric NOT NULL,
  fee numeric NOT NULL DEFAULT 0,
  daily_return numeric NOT NULL,
  term_days integer NOT NULL,
  total_return numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX investments_user_idx ON public.investments (user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own investments" ON public.investments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own investments" ON public.investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own investments" ON public.investments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  label text NOT NULL DEFAULT '',
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  reference text UNIQUE,
  investment_id uuid REFERENCES public.investments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transactions_user_idx ON public.transactions (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own transactions" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);