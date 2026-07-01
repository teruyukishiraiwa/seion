import { useCallback, useEffect, useMemo, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "seion:pwa-install-dismissed";
const VISITS_KEY = "seion:pwa-visits";
const WEEK = 7 * 24 * 60 * 60 * 1000;

export function usePwaInstall(edited: boolean) {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => window.matchMedia("(display-mode: standalone)").matches);
  const [dismissed, setDismissed] = useState(() => Number(localStorage.getItem(DISMISSED_KEY) || 0));
  const [manualOpen, setManualOpen] = useState(false);
  const isIos = useMemo(() => /iphone|ipad|ipod/i.test(navigator.userAgent), []);
  const visits = useMemo(() => {
    const next = Number(localStorage.getItem(VISITS_KEY) || 0) + 1;
    localStorage.setItem(VISITS_KEY, String(next));
    return next;
  }, []);

  useEffect(() => {
    const beforeInstall = (event: Event) => { event.preventDefault(); setDeferred(event as InstallPromptEvent); };
    const didInstall = () => { setInstalled(true); setDeferred(null); setManualOpen(false); };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", didInstall);
    return () => { window.removeEventListener("beforeinstallprompt", beforeInstall); window.removeEventListener("appinstalled", didInstall); };
  }, []);

  const available = !installed && (deferred != null || isIos);
  const autoOpen = available && !manualOpen && Date.now() - dismissed > WEEK && (edited || visits >= 2);
  const open = useCallback(() => setManualOpen(true), []);
  const close = useCallback(() => setManualOpen(false), []);
  const dismiss = useCallback(() => { const now = Date.now(); localStorage.setItem(DISMISSED_KEY, String(now)); setDismissed(now); setManualOpen(false); }, []);
  const install = useCallback(async () => {
    if (!deferred) { setManualOpen(true); return; }
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setInstalled(true); else dismiss();
    setDeferred(null);
  }, [deferred, dismiss]);

  return { available, isIos, open: manualOpen || autoOpen, show: open, close, dismiss, install };
}