import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { IdCard } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, Field, PageHeader, Segmented } from "@/components/hk/ui";
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

function UpdateKyc() {
  const navigate = useNavigate();
  const { profile, setProfile } = useApp();
  const { saveProfile } = useAuth();
  const [idType, setIdType] = useState(profile.idType);
  const [idNumber, setIdNumber] = useState(profile.idNumber);
  const [saving, setSaving] = useState(false);

  const changed = idType !== profile.idType || idNumber !== profile.idNumber;

  async function handleSave() {
    if (!idType || !idNumber || saving) return;
    setSaving(true);
    try {
      await saveProfile({ idType, idNumber });
      setProfile({ ...profile, idType, idNumber });
      toast.success("KYC details updated", "Your identification details have been saved.");
      navigate({ to: "/profile" });
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
        <Card className="border-primary/30 bg-accent/20">
          <p className="text-xs leading-relaxed text-muted-foreground">
            This is the government-issued ID Heaktar uses to verify your identity. Make sure the
            details exactly match your document.
          </p>
        </Card>

        <Segmented
          label="ID type"
          value={idType}
          onChange={setIdType}
          options={["National ID", "Passport"]}
        />
        <Field
          icon={IdCard}
          label="ID number"
          placeholder="0000-0000-000"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
        />

        <Button full disabled={!changed || !idType || !idNumber || saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save KYC details"}
        </Button>
      </div>
    </Screen>
  );
}
