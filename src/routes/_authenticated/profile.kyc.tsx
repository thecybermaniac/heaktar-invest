import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, Building2, CreditCard, Globe, Home, IdCard, MapPin, Users } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import {
  Button,
  Card,
  Chips,
  DatePicker,
  Field,
  PageHeader,
  Segmented,
  Select,
} from "@/components/hk/ui";
import { useProfileStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/hk/toast";

export const Route = createFileRoute("/_authenticated/profile/kyc")({
  head: () => ({
    meta: [
      { title: "Update KYC details — Heaktar Nigeria" },
      {
        name: "description",
        content: "Update the KYC details for your Heaktar account.",
      },
      { property: "og:title", content: "Update KYC details — Heaktar Nigeria" },
      { property: "og:description", content: "Update your identity verification details." },
    ],
  }),
  component: UpdateKyc,
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

function UpdateKyc() {
  const { profile, setProfile } = useProfileStore();
  const [form, setForm] = useState(profile);
  const { saveProfile } = useAuth();
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
      <PageHeader title="Update KYC details" subtitle="Your identification details" />
      <div className="space-y-4 px-5 pt-5">
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

        <Button full disabled={saving || isUnchanged} onClick={handleSave}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </Screen>
  );
}
