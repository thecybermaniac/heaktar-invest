import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Briefcase, Building2, Check, CreditCard, Globe, Hash, Home, IdCard, MapPin, Users } from "lucide-react";
import { Button, Chips, DatePicker, Field, Segmented, Select } from "@/components/hk/ui";
import { useApp, type Profile } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Complete your profile — Heaktar" },
      { name: "description", content: "Tell us about yourself so we can tailor investment plans and keep your Heaktar account compliant." },
      { property: "og:title", content: "Complete your profile — Heaktar" },
      { property: "og:description", content: "A short guided setup before your first Heaktar investment." },
    ],
  }),
  component: Onboarding,
});

const STEPS = ["Personal", "Location", "Identity", "Financial", "Review"];

const NATIONALITIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "United Kingdom", "United States", "Canada"];
const STATES = ["Lagos", "Abuja (FCT)", "Rivers", "Kano", "Oyo", "Enugu", "Kaduna"];
const GENDER_OPTIONS = ["Female", "Male", "Other", "Prefer not to say"]

function Onboarding() {
  const navigate = useNavigate();
  const { profile, setProfile } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Profile>({ ...profile, dob: "", gender: "", state: "", city: "", address: "", idNumber: "", occupation: "" });
  const [agreed, setAgreed] = useState(false);
  const set = (k: keyof Profile, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const [saving, setSaving] = useState(false);

  const next = async () => {
    if (step < STEPS.length - 1) return setStep((s) => s + 1);
    setSaving(true);
    try {
      await saveProfile({ ...form, onboardingCompleted: true });
      setProfile(form);
      toast.success("Profile saved", "Your account is ready to invest.");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Couldn't save your profile", "Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-surface">
      <div className="flex w-full max-w-md flex-col bg-background px-6 pb-10 pt-12">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (step === 0 ? navigate({ to: "/register" }) : setStep((s) => s - 1))}
            className="grid size-9 place-items-center rounded-full border border-border bg-card"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </span>
        </div>

        <div className="mt-4 flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-input")}
            />
          ))}
        </div>

        <div className="mt-8 flex-1 space-y-5">
          {step === 0 && (
            <>
              <Heading title="A bit about you" sub="We use this to verify your identity." />
              <DatePicker label="Date of birth" value={form.dob} onChange={(v) => set("dob", v)} />
              <Select label="Gender" icon={Users} value={form.gender} onChange={(v) => set("gender", v)} options={GENDER_OPTIONS} placeholder="Select Gender" />
              <Select label="Nationality" icon={Globe} value={form.nationality} onChange={(v) => set("nationality", v)} options={NATIONALITIES} />
            </>
          )}

          {step === 1 && (
            <>
              <Heading title="Where do you live?" sub="Your residential details." />
              <Select label="State" icon={MapPin} value={form.state} onChange={(v) => set("state", v)} options={STATES} placeholder="Select State" />
              <Field icon={Building2} label="City" placeholder="Ikeja" value={form.city} onChange={(e) => set("city", e.target.value)} />
              <Field icon={Home} label="Residential address" placeholder="14 Allen Avenue" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </>
          )}

          {step === 2 && (
            <>
              <Heading title="Verify your identity" sub="Choose a government-issued document." />
              <Segmented label="ID type" value={form.idType} onChange={(v) => set("idType", v)} options={["National ID", "Passport", "Driver's License"]} />
              <Field icon={IdCard} label="ID number" placeholder="NIN-0000-0000" value={form.idNumber} onChange={(e) => set("idNumber", e.target.value)} />
            </>
          )}

          {step === 3 && (
            <>
              <Heading title="Financial profile" sub="This shapes the plans we recommend." />
              <Field icon={Briefcase} label="Occupation" placeholder="Product Designer" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
              <Chips label="Employment status" value={form.employmentStatus} onChange={(v) => set("employmentStatus", v)} options={["Employed", "Self-employed", "Business owner", "Student", "Retired"]} />
              <Select label="Primary source of funds" icon={CreditCard} value={form.sourceOfFunds} onChange={(v) => set("sourceOfFunds", v)} options={["Salary", "Business income", "Savings", "Investments", "Inheritance", "Gift"]} />
              <Chips label="Investment experience" value={form.experience} onChange={(v) => set("experience", v)} options={["None", "Beginner", "Intermediate", "Advanced"]} />
              <Chips label="Risk tolerance" value={form.riskTolerance} onChange={(v) => set("riskTolerance", v)} options={["Conservative", "Balanced", "Aggressive"]} />
            </>
          )}

          {step === 4 && (
            <>
              <Heading title="Review & confirm" sub="Check that everything looks right." />
              <div className="divide-y divide-border rounded border border-border bg-card">
                <Row label="Name" value={`${form.firstName} ${form.lastName}`} />
                <Row label="Date of birth" value={form.dob || "—"} />
                <Row label="Gender" value={form.gender || "—"} />
                <Row label="Nationality" value={form.nationality} />
                <Row label="Address" value={[form.address, form.city, form.state].filter(Boolean).join(", ") || "—"} />
                <Row label="ID" value={`${form.idType} · ${form.idNumber || "—"}`} />
                <Row label="Occupation" value={form.occupation || "—"} />
                <Row label="Employment" value={form.employmentStatus || "—"} />
                <Row label="Source of funds" value={form.sourceOfFunds || "—"} />
                <Row label="Experience" value={form.experience || "—"} />
                <Row label="Risk tolerance" value={form.riskTolerance || "—"} />
              </div>
              <button
                type="button"
                onClick={() => setAgreed((a) => !a)}
                className="flex w-full items-start gap-3 rounded border border-border bg-card p-4 text-left"
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border",
                    agreed ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {agreed && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  I confirm the information above is accurate and I agree to Heaktar's Terms of Service,
                  Privacy Policy and Investment Risk Disclosure.
                </span>
              </button>
            </>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="w-28">
              Back
            </Button>
          )}
          <Button full onClick={next} disabled={step === STEPS.length - 1 && !agreed}>
            {step === STEPS.length - 1 ? "Submit & continue" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-xs font-medium">{value}</span>
    </div>
  );
}
