import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isOnboarded } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/" });

    const onboarded = await isOnboarded(data.user.id);
    const onOnboarding = location.pathname.startsWith("/onboarding");

    if (!onboarded && !onOnboarding) throw redirect({ to: "/onboarding", replace: true });
    if (onboarded && onOnboarding) throw redirect({ to: "/dashboard", replace: true });

    return { user: data.user, onboarded };
  },
  component: () => <Outlet />,
});
