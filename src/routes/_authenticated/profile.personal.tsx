import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, Building2, CreditCard, Globe, Home, MapPin, Mail, Users } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, Chips, DatePicker, Field, PageHeader, Select } from "@/components/hk/ui";
import { useApp } from "@/lib/app-store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/hk/toast";

export const Route = createFileRoute("/_authenticated/profile/personal")({
  head: () => ({
    meta: [
      { title: "Personal information — Heaktar" },
      {
        name: "description",
        content: "Update your personal, location and financial details on your Heaktar profile.",
      },
      { property: "og:title", content: "Personal information — Heaktar" },
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
  const { profile, setProfile } = useApp();
  const { saveProfile } = useAuth();
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

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
      <PageHeader title="Personal Information" subtitle="Your details on file" />
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
        <DatePicker label="Date of birth" value={form.dob} onChange={(v) => set("dob", v)} />
        <Select
          label="Gender"
          icon={Users}
          value={form.gender}
          onChange={(v) => set("gender", v)}
          options={GENDER_OPTIONS}
        />
        <Select
          label="Nationality"
          icon={Globe}
          value={form.nationality}
          onChange={(v) => set("nationality", v)}
          options={NATIONALITIES}
        />
        <Select
          label="State"
          icon={MapPin}
          value={form.state}
          onChange={(v) => set("state", v)}
          options={STATES}
        />
        <Field
          icon={Building2}
          label="City"
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <Field
          icon={Home}
          label="Residential address"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />
        <Field
          icon={Briefcase}
          label="Occupation"
          value={form.occupation}
          onChange={(e) => set("occupation", e.target.value)}
        />
        <Chips
          label="Employment status"
          value={form.employmentStatus}
          onChange={(v) => set("employmentStatus", v)}
          options={["Employed", "Self-employed", "Business owner", "Student", "Retired"]}
        />
        <Select
          label="Primary source of funds"
          icon={CreditCard}
          value={form.sourceOfFunds}
          onChange={(v) => set("sourceOfFunds", v)}
          options={["Salary", "Business income", "Savings", "Investments", "Inheritance", "Gift"]}
        />
        <Chips
          label="Investment experience"
          value={form.experience}
          onChange={(v) => set("experience", v)}
          options={["None", "Beginner", "Intermediate", "Advanced"]}
        />
        <Chips
          label="Risk tolerance"
          value={form.riskTolerance}
          onChange={(v) => set("riskTolerance", v)}
          options={["Conservative", "Balanced", "Aggressive"]}
        />

        <Button full disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </Screen>
  );
}
