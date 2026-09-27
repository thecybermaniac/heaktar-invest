import { useEffect, useState } from "react";
import { Share, SquarePlus, Smartphone, X } from "lucide-react";
import { Button } from "@/components/hk/ui";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { cn } from "@/lib/utils";

export function InstallAppModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, promptInstall } = usePwaInstall();
  const [shown, setShown] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!open) return null;

  async function handleInstall() {
    setInstalling(true);
    const outcome = await promptInstall();
    setInstalling(false);
    // "unavailable" can happen if Chrome hadn't fired beforeinstallprompt in time — the
    // sheet already told the person how to add it manually via the browser menu, so just
    // close either way rather than leaving them stuck on this screen.
    if (outcome !== "unavailable") onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          shown ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        className={cn(
          "relative w-full max-w-md rounded-t-2xl border-t border-border bg-background p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-float transition-transform duration-300 ease-out",
          shown ? "translate-y-0" : "translate-y-full",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="size-4" />
        </button>

        <span className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
          <Smartphone className="size-6" strokeWidth={2.1} />
        </span>

        <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
          {state === "ios" ? "Add Heaktar to your Home Screen" : "Install the Heaktar app"}
        </h2>

        {state === "ios" ? (
          <>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Add Heaktar to your Home Screen for one-tap access and a faster, full-screen experience —
              no App Store needed.
            </p>
            <div className="mt-5 space-y-3">
              <Step icon={Share} step={1}>
                Tap the <span className="font-medium text-foreground">Share</span> icon in Safari's toolbar
              </Step>
              <Step icon={SquarePlus} step={2}>
                Scroll down and tap{" "}
                <span className="font-medium text-foreground">Add to Home Screen</span>
              </Step>
            </div>
            <Button full className="mt-6" onClick={onClose}>
              Got it
            </Button>
          </>
        ) : (
          <>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Get one-tap access from your Home Screen, faster load times and push alerts for payouts —
              no App Store needed.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" onClick={onClose} className="w-28">
                Maybe later
              </Button>
              <Button full onClick={() => void handleInstall()} disabled={installing}>
                {installing ? "Installing…" : "Install app"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Step({
  icon: Icon,
  step,
  children,
}: {
  icon: typeof Share;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
        {step}
      </span>
      <p className="flex-1 text-sm leading-5 text-muted-foreground">{children}</p>
      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
    </div>
  );
}
