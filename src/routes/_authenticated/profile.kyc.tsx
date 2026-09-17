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
import { useApp } from "@/lib/app-store";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/hk/toast";

export const Route = createFileRoute("/_authenticated/profile/kyc")({
  head: () => ({
    meta: [
      { title: "Update KYC details — Heaktar" },
      {
        name: "description",
        content: "Update the government-issued ID on file for your Heaktar account.",
      },
      { property: "og:title", content: "Update KYC details — Heaktar" },
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
  const { profile, setProfile } = useApp();
  const [form, setForm] = useState(profile);
  const { saveProfile } = useAuth();
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
      <PageHeader title="Update KYC details" subtitle="Your identification on file" />
      <div className="space-y-4 px-5 pt-5">
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
