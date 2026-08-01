import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, TrendingUp } from "lucide-react";
import { Button, Field } from "@/components/hk/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Heaktar Investments" },
      { name: "description", content: "Sign in to Heaktar to track your portfolio, invest in daily-yield plans and withdraw anytime." },
      { property: "og:title", content: "Sign in — Heaktar Investments" },
      { property: "og:description", content: "Sign in to Heaktar to track your portfolio and invest in daily-yield plans." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("adaeze@heaktar.app");
  const [password, setPassword] = useState("password");

  return (
    <div className="flex min-h-screen justify-center bg-surface">
      <div className="flex w-full max-w-md flex-col bg-background px-6 pb-10 pt-14">
        <div className="grid size-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-float">
          <TrendingUp className="size-6" strokeWidth={2.4} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to keep your money working — daily.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/dashboard" });
          }}
        >
          <Field
            icon={Mail}
            label="Email address"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            icon={Lock}
            label="Password"
            type={show ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            trailing={
              <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password">
                {show ? (
                  <EyeOff className="size-[18px] text-muted-foreground" />
                ) : (
                  <Eye className="size-[18px] text-muted-foreground" />
                )}
              </button>
            }
          />
          <div className="flex justify-end">
            <button type="button" className="text-xs font-medium text-primary">
              Forgot password?
            </button>
          </div>
          <Button full type="submit">
            Sign in
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" full onClick={() => navigate({ to: "/dashboard" })}>
          <GoogleMark />
          Continue with Google
        </Button>

        <p className="mt-auto pt-10 text-center text-sm text-muted-foreground">
          New to Heaktar?{" "}
          <Link to="/register" className="font-medium text-primary">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.6v3h3.86c2.26-2.08 3.58-5.15 3.58-8.79Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.87-3c-1.07.72-2.44 1.15-4.08 1.15-3.13 0-5.79-2.11-6.74-4.96H1.28v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.26 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.28a12 12 0 0 0 0 10.73l3.98-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.2 15.24 0 12 0A12 12 0 0 0 1.28 6.63l3.98 3.1C6.21 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}
