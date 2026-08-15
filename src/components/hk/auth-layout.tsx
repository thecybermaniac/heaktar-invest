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


export function Divider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
