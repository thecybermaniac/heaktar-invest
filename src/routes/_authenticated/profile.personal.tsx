import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, Building2, CreditCard, Globe, Home, MapPin, Mail, Users } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, Chips, DatePicker, Field, PageHeader, Select } from "@/components/hk/ui";
import { useProfileStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/hk/toast";

export const Route = createFileRoute("/_authenticated/profile/personal")({
  head: () => ({
    meta: [
      { title: "Personal information — Heaktar Nigeria" },
      {
        name: "description",
        content: "Update your personal, location and financial details on your Heaktar profile.",
      },
      { property: "og:title", content: "Personal information — Heaktar Nigeria" },
      { property: "og:description", content: "Update your profile details." },
    ],
  }),
  component: PersonalInformation,
});

const NATIONALITIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "United Kingdom",
  "United States",
  "Canada",
];
const STATES = ["Lagos", "Abuja (FCT)", "Rivers", "Kano", "Oyo", "Enugu", "Kaduna"];
const GENDER_OPTIONS = ["Female", "Male", "Other", "Prefer not to say"];

function EmailCard({ currentEmail }: { currentEmail: string }) {
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleChangeEmail() {
    if (!newEmail || newEmail === currentEmail) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setSent(true);
      toast.success("Confirmation sent", `Check ${newEmail} to confirm the change.`);
    } catch (err) {
      toast.error(
        "Couldn't update email",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</span>
      <p className="text-[15px] font-medium">{currentEmail}</p>

      {sent ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          A confirmation link was sent to {newEmail}. Your login email updates once you click it.
        </p>
      ) : editing ? (
        <div className="mt-3 space-y-2">
          <Field
            icon={Mail}
            type="email"
            placeholder="new@email.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <div className="flex gap-2">
            <Button className="flex-1" disabled={!newEmail || sending} onClick={handleChangeEmail}>
              {sending ? "Sending…" : "Send confirmation"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-xs font-medium text-primary"
        >
          Change email
        </button>
      )}
    </Card>
  );
}

function PersonalInformation() {
  const { profile, setProfile } = useProfileStore();
  const { saveProfile } = useAuth();
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isUnchanged = JSON.stringify(form) === JSON.stringify(profile);

  async function handleSave() {
    setSaving(true);
    try {
      await saveProfile(form);
      setProfile(form);
      toast.success("Profile updated", "Your personal information has been saved.");
    } catch (err) {
      toast.error("Couldn't save", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Personal Information" subtitle="Your basic details" />
      <div className="space-y-4 px-5 pt-5">
        <EmailCard currentEmail={profile.email} />

        <Field
          icon={Users}
          label="First name"
          value={form.firstName}
          onChange={(e) => set("firstName", e.target.value)}
        />
        <Field
          icon={Users}
          label="Last name"
          value={form.lastName}
          onChange={(e) => set("lastName", e.target.value)}
        />

        <Button full disabled={saving || isUnchanged} onClick={handleSave}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </Screen>
  );
}
