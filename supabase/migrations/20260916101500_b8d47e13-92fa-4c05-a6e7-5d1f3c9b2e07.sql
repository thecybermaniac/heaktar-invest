-- Referral feature: signup-time code validation + 5% first-investment bonus.
--
-- Note on delivery: the bonus is written to public.transactions, so the existing
-- transactions_create_notification trigger picks it up automatically ("Referral reward
-- received"), which in turn fires notifications_dispatch_push. No extra wiring needed for
-- the referrer to get an in-app notification and a push on their device.

-- Public, side-effect-free check used by the registration form to reject unknown referral
-- codes before signup. SECURITY DEFINER so it can read profiles.referral_code without
-- exposing the profiles table itself to anon.
CREATE OR REPLACE FUNCTION public.is_valid_referral_code(code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code);
$$;

GRANT EXECUTE ON FUNCTION public.is_valid_referral_code(text) TO anon, authenticated;

-- Replaces the existing handle_new_user() with one that refuses to persist a referred_by
-- value that doesn't match a real code. Body is otherwise unchanged from the original, so
-- the on_auth_user_created trigger keeps working as-is.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_referred_by text := NULLIF(trim(NEW.raw_user_meta_data->>'referred_by'), '');
BEGIN
  IF v_referred_by IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE referral_code = v_referred_by
  ) THEN
    v_referred_by := NULL;
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, email, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1), ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.email, ''),
    'HEAK-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 6)),
    v_referred_by
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Pays the referrer 5% of a referred user's FIRST investment, on the gross amount (before
-- the service fee). Fires on every investment insert but only acts on the investor's
-- first, so existing users and past investments are never retroactively credited.
CREATE OR REPLACE FUNCTION public.credit_referral_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_investment_count integer;
  v_referred_by text;
  v_referrer_id uuid;
  v_investor_name text;
  v_label text;
  v_bonus numeric;
BEGIN
  SELECT count(*) INTO v_investment_count FROM public.investments WHERE user_id = NEW.user_id;
  IF v_investment_count <> 1 THEN
    RETURN NEW; -- not this investor's first investment
  END IF;

  SELECT referred_by, trim(concat_ws(' ', first_name, last_name))
    INTO v_referred_by, v_investor_name
  FROM public.profiles WHERE id = NEW.user_id;

  IF v_referred_by IS NULL OR v_referred_by = '' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_referred_by;
  IF v_referrer_id IS NULL OR v_referrer_id = NEW.user_id THEN
    RETURN NEW; -- unknown code, or somehow self-referred
  END IF;

  v_bonus := round(NEW.amount * 0.05, 2);
  v_label := 'Referral bonus' || CASE WHEN COALESCE(v_investor_name, '') <> '' THEN ' — ' || v_investor_name ELSE '' END;

  -- reference is UNIQUE, so this can never double-pay for the same investment.
  INSERT INTO public.transactions (user_id, type, label, amount, status, reference, investment_id)
  VALUES (v_referrer_id, 'referral', v_label, v_bonus, 'completed', 'referral_' || NEW.id, NEW.id)
  ON CONFLICT (reference) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_referral_bonus() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_referral_bonus() TO service_role;

CREATE TRIGGER investments_credit_referral
AFTER INSERT ON public.investments
FOR EACH ROW EXECUTE FUNCTION public.credit_referral_bonus();

-- Referral page data. RLS stops a client joining into another user's profiles/investments
-- rows, so this returns exactly the safe subset for people who used the caller's own code.
-- Scoped via auth.uid() internally, never a parameter, so nobody can read someone else's list.
CREATE OR REPLACE FUNCTION public.list_my_referrals()
RETURNS TABLE (id uuid, name text, joined_at timestamptz, earned numeric, status text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    p.id,
    trim(concat_ws(' ', p.first_name, p.last_name)) AS name,
    p.created_at AS joined_at,
    COALESCE(b.earned, 0) AS earned,
    CASE WHEN COALESCE(b.earned, 0) > 0 THEN 'active' ELSE 'pending' END AS status
  FROM public.profiles p
  LEFT JOIN (
    SELECT i.user_id, sum(t.amount) AS earned
    FROM public.transactions t
    JOIN public.investments i ON i.id = t.investment_id
    WHERE t.type = 'referral' AND t.user_id = auth.uid()
    GROUP BY i.user_id
  ) b ON b.user_id = p.id
  WHERE p.referred_by = (SELECT referral_code FROM public.profiles WHERE id = auth.uid())
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_referrals() TO authenticated;
