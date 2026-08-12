import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { toast } from "@/components/hk/toast";

export function AuthShell({
  title,
  subtitle,
  back,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  back?: { to: string; label: string } | undefined;
  children: ReactNode;
  footer?: ReactNode | undefined;
}) {
  return (
    <div className="flex min-h-screen justify-center bg-surface">
      <div className="flex w-full max-w-md flex-col bg-background px-6 pb-10 pt-14">
        {back ? (
          <Link
            to={back.to}
            className="mb-6 inline-flex w-fit items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="grid size-9 place-items-center rounded-full border border-border bg-card">
              <ArrowLeft className="size-4" />
            </span>
            {back.label}
          </Link>
        ) : (
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-float">
            <TrendingUp className="size-6" strokeWidth={2.4} />
          </div>
        )}
        <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm font-normal text-muted-foreground">{subtitle}</p>
        {children}
        {footer && <div className="mt-auto pt-10">{footer}</div>}
      </div>
    </div>
  );
}

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await lovable.auth.signInWithOAuth("google", {
            redirect_uri: `${window.location.origin}/auth/callback`,
          });
        } catch {
          toast.error("Google sign-in failed", "Please try again or use your email and password.");
        }
      }}
      className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
    >
      <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.58-5.17 3.58-8.82Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.09A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l4.01-3.09Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4.01 3.09C6.23 6.86 8.88 4.75 12 4.75Z"
        />
      </svg>
      {label}
    </button>
  );
}

export function Divider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
