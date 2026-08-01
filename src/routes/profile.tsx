import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, ChevronRight, LogOut, Moon, Shield, User, Wallet } from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, Field, Toggle } from "@/components/hk/ui";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & settings — Heaktar" },
      { name: "description", content: "Manage your Heaktar personal details, appearance theme, password security and session." },
      { property: "og:title", content: "Profile & settings — Heaktar" },
      { property: "og:description", content: "Personal details, theme, security and session settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { profile, theme, toggleTheme } = useApp();
  const [pwOpen, setPwOpen] = useState(false);

  return (
    <Screen>
      <header className="flex flex-col items-center px-5 pt-8">
        <span className="grid size-20 place-items-center rounded-full bg-gradient-brand text-xl font-semibold text-primary-foreground shadow-float">
          {profile.firstName[0]}
          {profile.lastName[0]}
        </span>
        <h1 className="mt-3 text-lg font-semibold">
          {profile.firstName} {profile.lastName}
        </h1>
        <p className="text-xs text-muted-foreground">{profile.email}</p>
      </header>

      <section className="px-5 pt-6">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Personal information</h2>
        <Card className="p-0">
          <div className="divide-y divide-border">
            <Row label="Date of birth" value={profile.dob || "—"} />
            <Row label="Gender" value={profile.gender || "—"} />
            <Row label="Nationality" value={profile.nationality} />
            <Row label="Address" value={[profile.address, profile.city, profile.state].filter(Boolean).join(", ") || "—"} />
            <Row label="ID" value={`${profile.idType} · ${profile.idNumber}`} />
            <Row label="Occupation" value={profile.occupation || "—"} />
            <Row label="Employment" value={profile.employmentStatus} />
            <Row label="Source of funds" value={profile.sourceOfFunds} />
            <Row label="Experience" value={profile.experience} />
            <Row label="Risk tolerance" value={profile.riskTolerance} />
          </div>
        </Card>
      </section>

      <section className="px-5 pt-6">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Settings</h2>
        <Card className="p-0">
          <div className="divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Moon className="size-[18px] text-muted-foreground" strokeWidth={1.8} />
              <span className="flex-1 text-[13px] font-medium">Dark mode</span>
              <Toggle checked={theme === "dark"} onChange={toggleTheme} />
            </div>
            <button onClick={() => setPwOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <Shield className="size-[18px] text-muted-foreground" strokeWidth={1.8} />
              <span className="flex-1 text-[13px] font-medium">Change password</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
            {pwOpen && (
              <div className="space-y-3 px-4 py-4">
                <Field label="Current password" type="password" placeholder="••••••••" />
                <Field label="New password" type="password" placeholder="At least 8 characters" />
                <Button full onClick={() => setPwOpen(false)}>
                  Update password
                </Button>
              </div>
            )}
            <NavRow to="/notifications" icon={Bell} label="Notifications" />
            <NavRow to="/investments" icon={Wallet} label="My investments" />
            <NavRow to="/onboarding" icon={User} label="Update KYC details" />
          </div>
        </Card>
      </section>

      <div className="px-5 pt-6">
        <Button variant="danger" full onClick={() => navigate({ to: "/" })}>
          <LogOut className="size-4" />
          Log out
        </Button>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">Heaktar v1.0.0</p>
      </div>
    </Screen>
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

function NavRow({ to, icon: Icon, label }: { to: string; icon: typeof Bell; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="size-[18px] text-muted-foreground" strokeWidth={1.8} />
      <span className="flex-1 text-[13px] font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
