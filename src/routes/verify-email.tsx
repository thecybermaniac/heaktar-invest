import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/hk/ui";
import { AuthShell } from "@/components/hk/auth-layout";
import { toast } from "@/components/hk/toast";
import { supabase } from "@/integrations/supabase/client";

type Search = { email: string | undefined; mode: "signup" | "reset" };

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    email: typeof search["email"] === "string" ? search["email"] : undefined,
    mode: search["mode"] === "reset" ? "reset" : "signup",
  }),
  head: () => ({
    meta: [
      { title: "Verify your email — Heaktar" },
      {
        name: "description",
        content: "Confirm your email address to activate your Heaktar account and start investing.",
      },
      { property: "og:title", content: "Verify your email — Heaktar" },
      { property: "og:description", content: "Confirm your email to activate your Heaktar account." },
    ],
  }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const { email, mode } = Route.useSearch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const isReset = mode === "reset";

  async function resend() {
    if (!email) {
      toast.info("Email missing", "Go back and enter your email address first.");
      return;
    }
    setBusy(true);
    const { error } = isReset
      ? await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
      : await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
    setBusy(false);
    if (error) {
      toast.error("Couldn't resend the email", "Please wait a minute and try again.");
      return;
    }
    toast.success("Email sent", `We sent a fresh link to ${email}.`);
  }

  return (
    <AuthShell
      title={isReset ? "Check Your Inbox" : "Verify Your Email"}
      subtitle={
        isReset
          ? "We sent a secure password reset link. Open it on this device to set a new password."
          : "We sent a verification link to your email. Confirm it to activate your account."
      }
      back={{ to: "/", label: "Back to sign in" }}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Wrong email?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register again
          </Link>
        </p>
      }
    >
      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-3 rounded border border-border bg-card p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
            <MailCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium">Sent to</p>
            <p className="truncate text-xs text-muted-foreground">{email ?? "your email address"}</p>
          </div>
        </div>
        <Button full variant="outline" disabled={busy} onClick={resend}>
          {busy ? "Sending…" : "Resend email"}
        </Button>
        <Button full onClick={() => navigate({ to: "/" })}>
          I've confirmed — sign in
        </Button>
      </div>
    </AuthShell>
  );
}
