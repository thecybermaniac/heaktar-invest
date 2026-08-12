import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User, Gift, Eye, EyeOff, TrendingUp, Info } from "lucide-react";
import { Button, Field } from "@/components/hk/ui";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — Heaktar" },
      {
        name: "description",
        content:
          "Open a Heaktar account in minutes and start earning daily returns on curated investment plans.",
      },
      { property: "og:title", content: "Create account — Heaktar" },
      {
        property: "og:description",
        content: "Open a Heaktar account and start earning daily returns.",
      },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const { setProfile } = useApp();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    ref: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="flex min-h-screen justify-center bg-surface">
      <div className="w-full max-w-md bg-background px-6 pb-12 pt-14">
        <div className="grid size-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-float">
          <TrendingUp className="size-6" strokeWidth={2.4} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Create Your Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">It takes about two minutes.</p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.firstName || form.lastName || form.email) {
              setProfile({
                firstName: form.firstName || "Adaeze",
                lastName: form.lastName || "Heaktar",
                email: form.email || "adaeze@heaktar.app",
              });
            }
            navigate({ to: "/onboarding" });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field
              icon={User}
              label="First name"
              placeholder="Adaeze"
              value={form.firstName}
              onChange={set("firstName")}
            />
            <Field
              icon={User}
              label="Last name"
              placeholder="Heaktar"
              value={form.lastName}
              onChange={set("lastName")}
            />
          </div>
          <Field
            icon={Mail}
            label="Email address"
            type="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={set("email")}
          />
          <Field
            icon={Lock}
            label="Password"
            type={show ? "text" : "password"}
            placeholder="At least 8 characters"
            value={form.password}
            onChange={set("password")}
            trailing={
              <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password">
                {show ? (
                  <EyeOff className="size-4.5 text-muted-foreground" />
                ) : (
                  <Eye className="size-4.5 text-muted-foreground" />
                )}
              </button>
            }
          />
          <Field
            icon={Gift}
            label="Referral code (optional)"
            placeholder="HEAK-0000"
            value={form.ref}
            onChange={set("ref")}
          />

          <div className="flex gap-2">
            <Info size={28} />
            <p className="text-xs text-muted-foreground">
              By registering, you agree to Heaktar's <a href="#">Terms & Conditions</a> and{" "}
              <a href="#">Privacy Policy, and to recieve emails with updates</a>
            </p>
          </div>

          <Button full type="submit" className="mt-2">
            Register
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
