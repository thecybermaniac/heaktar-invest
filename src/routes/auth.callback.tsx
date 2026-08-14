import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/hk/toast";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — Heaktar" },
      { name: "description", content: "Completing your secure Heaktar sign-in." },
      { property: "og:title", content: "Signing you in — Heaktar" },
      { property: "og:description", content: "Completing your secure Heaktar sign-in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    const finish = (session: unknown) => {
      if (done) return;
      done = true;
      if (session) {
        toast.success("You're signed in", "Welcome to Heaktar.");
        navigate({ to: "/dashboard", replace: true });
      } else {
        toast.error("Sign-in didn't complete", "Please try signing in again.");
        navigate({ to: "/", replace: true });
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(session);
    });

    const timer = setTimeout(() => {
      void supabase.auth.getSession().then(({ data }) => finish(data.session));
    }, 1200);

    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-surface px-6 text-center">
      <div>
        <Loader2 className="mx-auto size-6 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Finishing sign-in…</p>
      </div>
    </div>
  );
}
