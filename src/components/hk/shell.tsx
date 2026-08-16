import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Wallet, Plus, Users, User, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/dashboard", label: "Home", icon: LayoutGrid },
  { to: "/investments", label: "Portfolio", icon: Wallet },
  { to: "/invest", label: "Invest", icon: Plus, center: true },
  { to: "/referral", label: "Rewards", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="pointer-events-auto w-full max-w-md border-t border-border bg-background/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl">
        <div className="flex items-end justify-between">
          {TABS.map(({ to, label, icon: Icon, ...rest }) => {
            const center = "center" in rest && rest.center;
            const active = pathname === to || pathname.startsWith(`${to}/`);
            if (center) {
              return (
                <Link
                  key={to}
                  to={to}
                  className="-mt-7 flex w-14 flex-col items-center gap-1"
                  aria-label="Invest"
                >
                  <span className="grid size-14 place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-float ring-4 ring-background">
                    <Icon className="size-6" strokeWidth={2.2} />
                  </span>
                </Link>
              );
            }
            return (
              <Link key={to} to={to} className="flex w-16 flex-col items-center gap-1 py-1.5">
                <Icon
                  className={cn("size-5.25", active ? "text-primary" : "text-muted-foreground")}
                  strokeWidth={active ? 2.2 : 1.7}
                />
                <span className={cn("text-[10px]", active ? "font-medium text-primary" : "text-muted-foreground")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

const TAB_PATHS = ["/dashboard", "/investments", "/investments/history", "/invest", "/referral", "/profile"];

function isTabRoute(pathname: string) {
  return TAB_PATHS.includes(pathname.replace(/\/$/, "") || "/");
}

export function Screen({
  children,
  nav,
  className,
}: {
  children: ReactNode;
  nav?: boolean;
  className?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showNav = nav ?? isTabRoute(pathname);
  return (
    <div className="flex min-h-screen justify-center bg-surface">
      <div
        className={cn(
          "relative w-full max-w-md bg-background",
          showNav ? "pb-28" : "pb-8",
          className,
        )}
      >
        {children}
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}

