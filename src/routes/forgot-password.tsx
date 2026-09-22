import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Button, Field } from "@/components/hk/ui";
import { AuthShell } from "@/components/hk/auth-layout";
import { toast } from "@/components/hk/toast";
import { supabase } from "@/integrations/supabase/client";
import { forgotSchema, firstIssue } from "@/lib/validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Heaktar Nigeria" },
      {
        name: "description",
        content:
          "Forgot your Heaktar password? Enter your email and we'll send you a secure reset link.",
      },
      { property: "og:title", content: "Reset your password — Heaktar Nigeria" },
      {
        property: "og:description",
        content: "Request a secure password reset link for your Heaktar account.",
      },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) {
      const issue = firstIssue(parsed.error);
      toast.error(issue.title, issue.description);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't send the link", "Please wait a moment and try again.");
      return;
    }
    toast.success("Reset link sent", `We emailed a secure link to ${parsed.data.email}.`);
    navigate({ to: "/verify-email", search: { email: parsed.data.email, mode: "reset" } });
  }

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter the email tied to your account and we'll send a secure reset link."
      back={{ to: "/", label: "Back to sign in" }}
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
        <Button full type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>
    </AuthShell>
  );
}
