import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useNavigate, useRouter } from "@tanstack/react-router";

/* ---------------- Button ---------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "soft" | "danger";
  size?: "md" | "lg" | "sm";
  full?: boolean;
};

export function Button({ variant = "primary", size = "lg", full, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        size === "lg" && "h-12 px-5 text-[15px]",
        size === "md" && "h-10 px-4 text-sm",
        size === "sm" && "h-8 px-3 text-xs",
        variant === "primary" && "bg-primary text-primary-foreground shadow-[0_6px_18px_-6px_var(--primary)] hover:brightness-105",
        variant === "outline" && "border border-border bg-card text-foreground hover:bg-muted",
        variant === "soft" && "bg-accent text-accent-foreground hover:brightness-95",
        variant === "ghost" && "text-muted-foreground hover:bg-muted",
        variant === "danger" && "bg-destructive/10 text-destructive hover:bg-destructive/15",
        full && "w-full",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------- Card ---------------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4 shadow-card", className)}>{children}</div>
  );
}

/* ---------------- Field ---------------- */

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: LucideIcon;
  label?: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
};

export function Field({ icon: Icon, label, hint, error, trailing, className, ...props }: FieldProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>}
      <div
        className={cn(
          "flex h-12 items-center gap-2 rounded-xl border bg-input px-3 transition-colors focus-within:border-primary focus-within:bg-card",
          error ? "border-destructive" : "border-transparent",
        )}
      >
        {Icon && <Icon className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.8} />}
        <input
          className={cn(
            "h-full w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70",
            className,
          )}
          {...props}
        />
        {trailing}
      </div>
      {(error || hint) && (
        <span className={cn("mt-1.5 block text-xs", error ? "text-destructive" : "text-muted-foreground")}>
          {error || hint}
        </span>
      )}
    </label>
  );
}

/* ---------------- Custom Select ---------------- */

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select",
  label,
  icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  icon?: LucideIcon;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      {label && <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center gap-2 rounded-xl border bg-input px-3 text-left text-[15px] transition-colors",
          open ? "border-primary bg-card" : "border-transparent",
        )}
      >
        {Icon && <Icon className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.8} />}
        <span className={cn("flex-1 truncate", !value && "text-muted-foreground/70")}>{value || placeholder}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-40 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-float">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted"
            >
              {opt}
              {value === opt && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Custom Date Picker ---------------- */

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function DatePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(value) : new Date(1995, 0, 1);
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const shift = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const pretty = value
    ? new Date(value).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <div ref={ref} className="relative">
      {label && <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center gap-2 rounded-xl border bg-input px-3 text-left text-[15px]",
          open ? "border-primary bg-card" : "border-transparent",
        )}
      >
        <Calendar className="size-[18px] text-muted-foreground" strokeWidth={1.8} />
        <span className={cn("flex-1", !value && "text-muted-foreground/70")}>{pretty || "Select date"}</span>
      </button>
      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-2xl border border-border bg-popover p-3 shadow-float">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => shift(-1)} className="rounded-lg p-1.5 hover:bg-muted">
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex items-center gap-1 text-sm font-medium">
              <span>{MONTHS[view.m]}</span>
              <select
                aria-label="Year"
                value={view.y}
                onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))}
                className="appearance-none bg-transparent font-medium outline-none"
              >
                {Array.from({ length: 80 }, (_, i) => 2010 - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => shift(1)} className="rounded-lg p-1.5 hover:bg-muted">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: first }).map((_, i) => (
              <span key={`e${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
              const iso = `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const selected = value === iso;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={cn(
                    "aspect-square rounded-lg text-xs transition-colors",
                    selected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Segmented control ---------------- */

export function Segmented({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label?: string;
}) {
  return (
    <div>
      {label && <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>}
      <div className="flex gap-1 rounded-xl bg-input p-1">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "h-10 flex-1 rounded-lg text-xs font-medium transition-all",
              value === opt ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Chips ---------------- */

export function Chips({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label?: string;
}) {
  return (
    <div>
      {label && <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-medium transition-all",
              value === opt
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Toggle ---------------- */

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("h-7 w-12 rounded-full p-0.5 transition-colors", checked ? "bg-primary" : "bg-border")}
    >
      <span
        className={cn(
          "block size-6 rounded-full bg-card shadow-card transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

/* ---------------- Page header ---------------- */

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const router = useRouter();
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-5 py-3.5 backdrop-blur-xl">
      <button
        onClick={() => (router.history.length > 1 ? router.history.back() : navigate({ to: "/dashboard" }))}
        className="grid size-9 place-items-center rounded-full border border-border bg-card"
        aria-label="Go back"
      >
        <ChevronLeft className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "success" | "warning" | "danger" | "muted"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-medium",
        tone === "success" && "bg-accent text-accent-foreground",
        tone === "warning" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        tone === "danger" && "bg-destructive/10 text-destructive",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
