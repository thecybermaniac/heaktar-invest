import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button, Field } from "@/components/hk/ui";
import { AuthShell } from "@/components/hk/auth-layout";
import { toast } from "@/components/hk/toast";
import { supabase } from "@/integrations/supabase/client";
import { loginSchema, firstIssue } from "@/lib/validation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Heaktar Investments" },
      {
        name: "description",
        content:
          "Sign in to Heaktar to track your portfolio, invest in daily-yield plans and withdraw anytime.",
      },
      { property: "og:title", content: "Sign in — Heaktar Investments" },
      {
        property: "og:description",
        content: "Sign in to Heaktar to track your portfolio and invest in daily-yield plans.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const issue = firstIssue(parsed.error);
      toast.error(issue.title, issue.description);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Email not verified", "Check your inbox for the verification link.");
        navigate({ to: "/verify-email", search: { email: parsed.data.email, mode: "signup" as const } });
        return;
      }
      toast.error("Couldn't sign you in", "Your email or password is incorrect.");
      return;
    }
    toast.success("Welcome back", "Taking you to your dashboard.");
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to keep your money growing — daily."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          New to Heaktar?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      }
    >
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <Field
          icon={Mail}
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          icon={Lock}
          label="Password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={
            <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password">
              {show ? (
                <EyeOff className="size-4.5 text-muted-foreground" />
              ) : (
                <Eye className="size-4.5 text-muted-foreground" />
              )}
            </button>
          }
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>
        <Button full type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Log In"}
        </Button>
      </form>
    </AuthShell>
  );
}
