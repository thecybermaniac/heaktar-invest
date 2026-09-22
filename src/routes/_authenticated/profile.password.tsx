import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Field, PageHeader } from "@/components/hk/ui";
import { useApp } from "@/lib/app-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/hk/toast";

export const Route = createFileRoute("/_authenticated/profile/password")({
  head: () => ({
    meta: [
      { title: "Change password — Heaktar Nigeria" },
      { name: "description", content: "Update your Heaktar account password." },
      { property: "og:title", content: "Change password — Heaktar Nigeria" },
      { property: "og:description", content: "Update your account password." },
    ],
  }),
  component: ChangePassword,
});

function ChangePassword() {
  const navigate = useNavigate();
  const { profile } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 8;
  const canSubmit = !!current && next.length >= 8 && next === confirm && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(undefined);
    try {
      // Re-verify the current password by attempting a real sign-in with it — this is the
      // actual security check, since updateUser() alone would let anyone with an open
      // session change the password with no proof they know the current one.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: current,
      });
      if (verifyError) {
        setError("Current password is incorrect");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) throw updateError;

      toast.success("Password changed", "Your password has been updated.");
      navigate({ to: "/profile" });
    } catch (err) {
      toast.error(
        "Couldn't change password",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Change Password" subtitle="Update your account password" />
      <div className="space-y-4 px-5 pt-5">
        <Field
          icon={Lock}
          type="password"
          label="Current password"
          placeholder="Enter your current password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            setError(undefined);
          }}
          error={error}
        />
        <Field
          icon={Lock}
          type="password"
          label="New password"
          placeholder="Enter a new password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          hint={!tooShort ? "At least 8 characters" : undefined}
          error={tooShort ? "At least 8 characters" : undefined}
        />
        <Field
          icon={Lock}
          type="password"
          label="Confirm new password"
          placeholder="Re-enter your new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? "Passwords don't match" : undefined}
        />

        <Button full disabled={!canSubmit} onClick={handleSubmit}>
          {saving ? "Updating…" : "Update password"}
        </Button>
      </div>
    </Screen>
  );
}
