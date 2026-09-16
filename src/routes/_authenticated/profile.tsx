import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
  Bell,
  Building,
  ChevronRight,
  Headphones,
  History,
  LogOut,
  Moon,
  Sheet,
  Shield,
  Star,
  User,
  UserCheck,
  UserCheck2,
  Wallet,
} from "lucide-react";
import { Screen } from "@/components/hk/shell";
import { Button, Card, Field, Toggle } from "@/components/hk/ui";
import { useApp } from "@/lib/app-store";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/hk/toast";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & settings — Heaktar" },
      {
        name: "description",
        content:
          "Manage your Heaktar personal details, appearance theme, password security and session.",
      },
      { property: "og:title", content: "Profile & settings — Heaktar" },
      {
        property: "og:description",
        content: "Personal details, theme, security and session settings.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { profile, theme, toggleTheme } = useApp();
  const { signOut } = useAuth();
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
        <Card className="p-0">
          <div className="divide-y divide-border">
            <NavRow to="/notifications" icon={User} label="Personal Information" />
            <NavRow to="/notifications" icon={Shield} label="Change Password" />
            <NavRow to="/withdraw" icon={ArrowDown} label="Withdraw Funds" />
            <NavRow to="/onboarding" icon={UserCheck2} label="Update KYC details" />
          </div>
        </Card>
      </section>

      <section className="px-5 pt-6">
        <Card className="p-0">
          <div className="divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Moon className="size-4.5 text-muted-foreground" strokeWidth={1.8} />
              <span className="flex-1 text-[13px] font-medium">Dark mode</span>
              <Toggle checked={theme === "dark"} onChange={toggleTheme} />
            </div>
            <NavRow to="/onboarding" icon={History} label="Transaction History" />
            <NavRow to="/onboarding" icon={Sheet} label="Account Statement" />
            <NavRow to="/onboarding" icon={Headphones} label="Get Support" />
            <NavRow to="/onboarding" icon={Building} label="About Heaktar" />
          </div>
        </Card>
      </section>

      <div className="px-5 pt-6">
        <Button
          variant="danger"
          full
          onClick={async () => {
            await signOut();
            toast.success("Signed out", "See you soon.");
            navigate({ to: "/", replace: true });
          }}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
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
      <Icon className="size-4.5 text-muted-foreground" strokeWidth={1.8} />
      <span className="flex-1 text-[13px] font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
