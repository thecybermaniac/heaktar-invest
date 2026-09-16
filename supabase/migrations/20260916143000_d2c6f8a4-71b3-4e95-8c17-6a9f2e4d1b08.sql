-- Withdrawal method (one saved Nigerian bank account per user) + withdrawal requests.
--
-- Note: a withdrawal still writes a pending row to public.transactions as before —
-- getPortfolio() counts pending debits against the balance, so that row is what holds the
-- funds. The request row below carries the bank details and the payout status for admin
-- processing, and links back to the transaction that holds the money.

CREATE TABLE public.withdrawal_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_code text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawal_methods TO authenticated;
GRANT ALL ON public.withdrawal_methods TO service_role;
ALTER TABLE public.withdrawal_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own withdrawal method" ON public.withdrawal_methods
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER withdrawal_methods_set_updated_at
BEFORE UPDATE ON public.withdrawal_methods
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  -- bank details are snapshotted, not referenced: a request must still show where the
  -- money was sent even if the user later changes their saved method.
  bank_code text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX withdrawal_requests_user_idx ON public.withdrawal_requests (user_id, created_at DESC);
CREATE INDEX withdrawal_requests_status_idx ON public.withdrawal_requests (status, created_at);

-- Users can see and create their own requests; only service_role may change status,
-- so a user can't mark their own payout as completed.
GRANT SELECT, INSERT ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create their own withdrawal requests" ON public.withdrawal_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
