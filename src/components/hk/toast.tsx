import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "loading";

export type ToastItem = {
  id: number;
  title: string;
  description?: string | undefined;
  variant: ToastVariant;
  duration: number;
};

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<Listener>();

function emit() {
  const snapshot = [...items];
  listeners.forEach((l) => l(snapshot));
}

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function push(
  variant: ToastVariant,
  title: string,
  description?: string,
  duration = variant === "error" ? 5000 : 3500,
) {
  const id = ++seq;
  items = [{ id, title, description, variant, duration }, ...items].slice(0, 3);
  emit();
  if (duration > 0 && typeof window !== "undefined") {
    window.setTimeout(() => dismiss(id), duration);
  }
  return id;
}

export const toast = {
  success: (title: string, description?: string) => push("success", title, description),
  error: (title: string, description?: string) => push("error", title, description),
  info: (title: string, description?: string) => push("info", title, description),
  loading: (title: string, description?: string) => push("loading", title, description, 0),
  dismiss,
};

const STYLES: Record<ToastVariant, { icon: typeof Info; ring: string; tint: string }> = {
  success: {
    icon: CheckCircle2,
    ring: "text-primary",
    tint: "bg-primary/12",
  },
  error: {
    icon: AlertTriangle,
    ring: "text-destructive",
    tint: "bg-destructive/12",
  },
  info: { icon: Info, ring: "text-foreground", tint: "bg-muted" },
  loading: { icon: Loader2, ring: "text-primary", tint: "bg-primary/12" },
};

function ToastCard({ item }: { item: ToastItem }) {
  const [shown, setShown] = useState(false);
  const { icon: Icon, ring, tint } = STYLES[item.variant];

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 overflow-hidden rounded-xl border border-border bg-card/95 p-3.5 shadow-float backdrop-blur-xl transition-all duration-300 ease-out",
        shown ? "translate-y-0 scale-100 opacity-100" : "-translate-y-3 scale-[0.97] opacity-0",
      )}
    >
      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", tint)}>
        <Icon
          className={cn("size-4.5", ring, item.variant === "loading" && "animate-spin")}
          strokeWidth={2.1}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5 text-foreground">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{item.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Dismiss notification"
        className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (next) => setList(next);
    listeners.add(listener);
    listener([...items]);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-[max(env(safe-area-inset-top),0.75rem)]">
      <div className="flex w-full max-w-md flex-col gap-2">
        {list.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
