import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User, Gift, Eye, EyeOff, Check } from "lucide-react";
import { Button, Field } from "@/components/hk/ui";
import { AuthShell } from "@/components/hk/auth-layout";
import { toast } from "@/components/hk/toast";
import { supabase } from "@/integrations/supabase/client";
import { registerSchema, firstIssue } from "@/lib/validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — Heaktar" },
      {
        name: "description",
        content:
          "Open a Heaktar account in minutes and start earning daily returns on curated investment plans.",
      },
      { property: "og:title", content: "Create account — Heaktar" },
      {
        property: "og:description",
        content: "Open a Heaktar account and start earning daily returns.",
      },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    ref: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ ...form, agreed });
    if (!parsed.success) {
      const issue = firstIssue(parsed.error);
      toast.error(issue.title, issue.description);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          referred_by: parsed.data.ref ?? "",
        },
      },
    });
    setBusy(false);
    if (error) {
      const already = error.message.toLowerCase().includes("already");
      toast.error(
        already ? "Account already exists" : "Couldn't create your account",
        already ? "Try signing in instead, or reset your password." : error.message,
      );
      return;
    }
    if (!data.session) {
      toast.success("Almost there", "Confirm your email to activate your account.");
      navigate({ to: "/verify-email", search: { email: parsed.data.email, mode: "signup" } });
      return;
    }
    toast.success("Account created", "Let's finish setting up your profile.");
    navigate({ to: "/onboarding" });
  }

  return (
    <AuthShell
      title="Create Your Account"
      subtitle="It takes about two minutes."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      }
    >
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field
            icon={User}
            label="First name"
            placeholder="Adaeze"
            value={form.firstName}
            onChange={set("firstName")}
          />
          <Field
            icon={User}
            label="Last name"
            placeholder="Heaktar"
            value={form.lastName}
            onChange={set("lastName")}
          />
        </div>
        <Field
          icon={Mail}
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={form.email}
          onChange={set("email")}
        />
        <Field
          icon={Lock}
          label="Password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={set("password")}
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
        <Field
          icon={Gift}
          label="Referral code (optional)"
          placeholder="HEAK-0000"
          value={form.ref}
          onChange={set("ref")}
        />

        <button
          type="button"
          onClick={() => setAgreed((a) => !a)}
          className="flex w-full items-start gap-3 text-left"
        >
          <span
            className={cn(
              "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border",
              agreed ? "border-primary bg-primary text-primary-foreground" : "border-border",
            )}
          >
            {agreed && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <span className="text-xs text-muted-foreground">
            I agree to Heaktar's Terms &amp; Conditions and Privacy Policy, and to receive emails
            with account updates.
          </span>
        </button>

        <Button full type="submit" disabled={busy || !agreed}>
          {busy ? "Creating account…" : "Register"}
        </Button>
      </form>
    </AuthShell>
  );
}
