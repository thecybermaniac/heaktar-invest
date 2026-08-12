import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, TrendingUp } from "lucide-react";
import { Button, Field } from "@/components/hk/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Heaktar Investments" },
      {
        name: "description",
        content:
          "Sign in to Heaktar to track your portfolio, invest in daily-yield plans and withdraw anytime.",
      },
      { property: "og:title", content: "Sign in — Heaktar Investments" },
      {
        property: "og:description",
        content: "Sign in to Heaktar to track your portfolio and invest in daily-yield plans.",
      },
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
        <h1 className="mt-6 text-2xl font-semibold">Welcome Back</h1>
        <p className="mt-1 text-sm text-muted-foreground font-normal">
          Sign in to keep your money growing — daily.
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
            label="Email Address"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs text-primary cursor-pointer hover:underline -mb-12"
            >
              Forgot Password?
            </button>
          </div>
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
                  <EyeOff className="size-4.5 text-muted-foreground" />
                ) : (
                  <Eye className="size-4.5 text-muted-foreground" />
                )}
              </button>
            }
          />
          <Button full type="submit">
            Log In
          </Button>
        </form>

        <p className="mt-auto pt-10 text-center text-sm text-muted-foreground">
          New to Heaktar?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
