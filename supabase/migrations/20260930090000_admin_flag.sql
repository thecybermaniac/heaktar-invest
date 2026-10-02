-- Marks an account as an admin, for the separate admin dashboard app's auth gate.
ALTER TABLE public.profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- The existing "Users can update their own profile" RLS policy only checks row ownership
-- (auth.uid() = id), not which columns are being changed, and profiles already has a
-- table-wide UPDATE grant for `authenticated`. Without this, any signed-in user could set
-- their own is_admin to true with a direct REST call — the app's UI never sending that
-- field isn't a real restriction, since RLS/grants are what Postgres actually enforces.
--
-- Note: a column-level `REVOKE UPDATE (is_admin) ... FROM authenticated` looks like the
-- obvious fix but does NOT work here — Postgres privilege checks are permissive/union-based,
-- so the existing table-level "GRANT UPDATE ON profiles TO authenticated" still permits it
-- regardless of a narrower column-level revoke (verified against a real Postgres instance
-- before writing this migration). A trigger that only inspects whether the value is actually
-- changing is what actually enforces this.
CREATE OR REPLACE FUNCTION public.prevent_self_admin_promotion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin AND current_user <> 'service_role' THEN
    RAISE EXCEPTION 'Only service_role may change is_admin';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_is_admin
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_admin_promotion();

-- To make an account an admin, run this manually (not exposed anywhere in either app):
--   UPDATE public.profiles SET is_admin = true WHERE email = 'the-admin-email@example.com';
