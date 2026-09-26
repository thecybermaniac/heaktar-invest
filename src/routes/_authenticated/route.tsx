import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { profileQueryOptions } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  // Without this, beforeLoad below re-runs — and re-hits Supabase twice — on every single
  // navigation between authenticated pages, since a router match with no staleTime is
  // treated as immediately stale. 30s means most in-app navigation (bottom-nav taps, back
  // button) reuses the cached auth/onboarding check instead of re-fetching it; a genuinely
  // stale login (session revoked, expired) still gets caught within that window, and
  // onboarding completion explicitly invalidates below rather than waiting it out.
  staleTime: 30_000,
  // Without a pendingComponent, TanStack Router shows nothing at all while beforeLoad/loader
  // are in flight — on a slow connection that reads as a frozen app, not a loading one.
  // pendingMs: show it fast rather than waiting out the router's 1s default. pendingMinMs:
  // but don't flash it for a few ms when the data was already warm from cache.
  pendingMs: 100,
  pendingMinMs: 300,
  pendingComponent: () => (
    <div className="grid min-h-dvh place-items-center">
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
  beforeLoad: async ({ location, context }) => {
    // getSession() reads the already-verified session from local storage — no network call.
    // getUser() re-validates the JWT against Supabase's Auth server every time, which is the
    // right call to make once, but not on every navigation. Fall back to it only when there's
    // no local session to trust in the first place.
    const { data: sessionData } = await supabase.auth.getSession();
    let user = sessionData.session?.user ?? null;

    if (!user) {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData.user) throw redirect({ to: "/" });
      user = userData.user;
    }

    // ensureQueryData reuses a fresh cache entry rather than re-fetching (see
    // dashboard.tsx's loader), and — more importantly here — this is what starts the
    // profile fetch as early as possible: during this auth gate, before any child route
    // or AuthProvider's own effect gets a chance to run. Every other authenticated route
    // shares this same query, so profile only travels the network once per staleTime
    // window instead of once per consumer.
    const profile = await context.queryClient.ensureQueryData(profileQueryOptions());
    const onboarded = profile.onboardingCompleted;
    const onOnboarding = location.pathname.startsWith("/onboarding");

    if (!onboarded && !onOnboarding) throw redirect({ to: "/onboarding", replace: true });
    if (onboarded && onOnboarding) throw redirect({ to: "/dashboard", replace: true });

    return { user, onboarded };
  },
  component: () => <Outlet />,
});
