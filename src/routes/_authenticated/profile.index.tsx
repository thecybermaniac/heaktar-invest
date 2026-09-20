import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import {
  ArrowDown,
  Bell,
  Building,
  Camera,
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
import { Button, Card, Toggle } from "@/components/hk/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from "@/lib/app-store";
import { useAuth } from "@/lib/auth";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { toast } from "@/components/hk/toast";

export const Route = createFileRoute("/_authenticated/profile/")({
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
  const { upload, uploading } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (file) void upload(file);
  }

  return (
    <Screen>
      <header className="flex flex-col items-center px-5 pt-8">
        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          className="group relative size-20 shrink-0 rounded-full"
          aria-label="Change profile photo"
        >
          <Avatar className="size-20 shadow-float">
            <AvatarImage src={profile.avatarUrl || undefined} alt="" />
            <AvatarFallback className="bg-gradient-brand text-xl font-semibold text-primary-foreground">
              {profile.firstName[0]}
              {profile.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Camera className="size-5" strokeWidth={1.8} />
            )}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground">
            <Camera className="size-3" strokeWidth={2} />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <h1 className="mt-3 text-lg font-semibold">
          {profile.firstName} {profile.lastName}
        </h1>
        <p className="text-xs text-muted-foreground">{profile.email}</p>
      </header>

      <section className="px-5 pt-6">
        <Card className="p-0">
          <div className="divide-y divide-border">
            <NavRow to="/profile/personal" icon={User} label="Personal Information" />
            <NavRow to="/profile/password" icon={Shield} label="Change Password" />
            <NavRow to="/withdraw" icon={ArrowDown} label="Withdraw Funds" />
            <NavRow to="/profile/kyc" icon={UserCheck2} label="Update KYC details" />
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
            <NavRow to="/profile/transactions" icon={History} label="Transaction History" />
            <NavRow to="/profile/statement" icon={Sheet} label="Account Statement" />
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
