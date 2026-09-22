import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button, Field } from "@/components/hk/ui";
import { AuthShell } from "@/components/hk/auth-layout";
import { toast } from "@/components/hk/toast";
import { supabase } from "@/integrations/supabase/client";
import { resetSchema, firstIssue } from "@/lib/validation";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — Heaktar Nigeria" },
      {
        name: "description",
        content: "Choose a new password for your Heaktar account and get back to investing.",
      },
      { property: "og:title", content: "Set a new password — Heaktar Nigeria" },
      { property: "og:description", content: "Choose a new password for your Heaktar account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    const isRecovery = hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session || isRecovery) setReady(true);
      else {
        toast.error("Link expired", "Request a new password reset link to continue.");
        navigate({ to: "/forgot-password" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = resetSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      const issue = firstIssue(parsed.error);
      toast.error(issue.title, issue.description);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setBusy(false);
    if (error) {
      toast.error("Couldn't update your password", error.message);
      return;
    }
    toast.success("Password updated", "Sign in with your new password.");
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <AuthShell
      title="Set a New Password"
      subtitle="Choose a strong password you haven't used before."
      back={{ to: "/", label: "Back to sign in" }}
    >
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <Field
          icon={Lock}
          label="New password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder="At least 8 characters"
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
        <Field
          icon={Lock}
          label="Confirm password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button full type="submit" disabled={busy || !ready}>
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
