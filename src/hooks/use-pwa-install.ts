import { useCallback, useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Module-scope, not component state: `beforeinstallprompt` fires once per page load,
// at a time Chrome decides on its own (once the manifest/service-worker installability
// criteria are met) — often before the user has navigated to whatever page renders the
// install UI. Attaching the listener here means it's registered the moment this module
// is first imported (from __root.tsx, so effectively app boot), not only once a
// component using the hook happens to mount.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
  // Best-effort early registration: Chrome won't fire beforeinstallprompt at all unless
  // a service worker is already registered, and the only other place that happens
  // (use-push-notifications.ts) doesn't run until the user visits /notifications —
  // often well after onboarding. Registering here too (idempotent, same script) gives
  // the install prompt a real chance to be ready by the time onboarding finishes.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return deferredPrompt;
}

function getServerSnapshot() {
  return null;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iphone|ipod|ipad/i.test(ua) && !("MSStream" in window);
}

export type PwaInstallState = "installed" | "android" | "ios" | "unsupported";

export function usePwaInstall() {
  const prompt = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const state: PwaInstallState = isStandalone()
    ? "installed"
    : prompt
      ? "android"
      : isIosSafari()
        ? "ios"
        : "unsupported";

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notify();
    return outcome;
  }, []);

  return { state, promptInstall };
}
