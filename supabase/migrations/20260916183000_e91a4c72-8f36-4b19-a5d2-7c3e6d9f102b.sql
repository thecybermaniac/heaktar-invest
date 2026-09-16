-- profiles.email is a denormalized copy set once at signup by handle_new_user(); it's never
-- kept in sync afterward. Now that Personal Information supports a real email change
-- (supabase.auth.updateUser({ email }), confirmed via a link Supabase sends to the new
-- address), this keeps profiles.email authoritative once auth.users.email actually changes
-- — which only happens after the user clicks that confirmation link, not the moment they
-- submit the form.
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_email() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_email_updated
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION public.sync_profile_email();
