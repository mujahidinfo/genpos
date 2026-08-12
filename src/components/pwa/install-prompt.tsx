"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/language-context";
import {
  Download, X, Share, PlusSquare, MoreVertical,
  Check, Smartphone, Monitor,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";

/**
 * Chrome/Edge fire this instead of showing their own install UI once we call
 * preventDefault(), handing us the deferred prompt to trigger on our own button.
 * Not in lib.dom yet, so it is typed here.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "genpos:install-dismissed-at";
/** Re-offer the install two weeks after a dismissal rather than never again. */
const DISMISS_DAYS = 14;

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as Macintosh, so also check for touch support.
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIos) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag for home-screen apps.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function wasRecentlyDismissed(): boolean {
  try {
    const at = localStorage.getItem(DISMISS_KEY);
    if (!at) return false;
    const days = (Date.now() - Number(at)) / 86_400_000;
    return days < DISMISS_DAYS;
  } catch {
    return false; // Private mode / storage blocked — just show the prompt.
  }
}

// ─── Step-by-step instructions ────────────────────────────────────────────────

function InstructionStep({ n, icon, children }: {
  n: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      <span className="flex-1 text-sm text-slate-600 leading-relaxed flex items-center gap-2 flex-wrap">
        {children}
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500 shrink-0">
          {icon}
        </span>
      </span>
    </li>
  );
}

function HowToDialog({ open, onClose, platform }: {
  open: boolean;
  onClose: () => void;
  platform: Platform;
}) {
  const { t } = useTranslation();
  // Desktop users who reach the manual instructions are almost always on a
  // phone-shaped tablet or an unsupported browser; Android steps fit best.
  const [tab, setTab] = useState<"ios" | "android">(
    platform === "ios" ? "ios" : "android",
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="px-6 pt-6 pb-4">
          <DialogTitle className="text-base font-black text-slate-900">
            {tab === "ios" ? t("pwa.iosTitle") : t("pwa.androidTitle")}
          </DialogTitle>
        </div>

        {/* Platform switcher — users often install on a device other than the
            one they're reading this on. */}
        <div className="px-6">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {([
              { key: "ios" as const, label: t("pwa.platformIos"), Icon: Smartphone },
              { key: "android" as const, label: t("pwa.platformAndroid"), Icon: Monitor },
            ]).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-bold transition-all",
                  tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          <ol className="space-y-4">
            {tab === "ios" ? (
              <>
                <InstructionStep n={1} icon={<Share className="h-3.5 w-3.5" />}>
                  {t("pwa.iosStep1")}
                </InstructionStep>
                <InstructionStep n={2} icon={<PlusSquare className="h-3.5 w-3.5" />}>
                  {t("pwa.iosStep2")}
                </InstructionStep>
                <InstructionStep n={3} icon={<Check className="h-3.5 w-3.5" />}>
                  {t("pwa.iosStep3")}
                </InstructionStep>
              </>
            ) : (
              <>
                <InstructionStep n={1} icon={<MoreVertical className="h-3.5 w-3.5" />}>
                  {t("pwa.androidStep1")}
                </InstructionStep>
                <InstructionStep n={2} icon={<Download className="h-3.5 w-3.5" />}>
                  {t("pwa.androidStep2")}
                </InstructionStep>
                <InstructionStep n={3} icon={<Check className="h-3.5 w-3.5" />}>
                  {t("pwa.androidStep3")}
                </InstructionStep>
              </>
            )}
          </ol>

          {tab === "ios" && (
            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
              {t("pwa.iosNote")}
            </p>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold transition-colors active:scale-[0.98]"
          >
            {t("pwa.gotIt")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Install banner ───────────────────────────────────────────────────────────

export function InstallPrompt() {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);

    // Already installed, or dismissed recently — stay out of the way.
    if (isStandalone() || wasRecentlyDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // suppress Chrome's own mini-infobar
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS never fires beforeinstallprompt, so surface the manual path instead —
    // delayed so it doesn't slam the user the instant the page paints.
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (p === "ios") {
      timer = setTimeout(() => setVisible(true), 3000);
    }

    const onInstalled = () => setVisible(false);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage blocked — dismissal just won't persist */
    }
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferred) {
      // iOS (or a browser that never fired the event) — show manual steps.
      setHowToOpen(true);
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setVisible(false);
    else dismiss();
  }, [deferred, dismiss]);

  if (!visible) {
    return (
      <HowToDialog
        open={howToOpen}
        onClose={() => setHowToOpen(false)}
        platform={platform}
      />
    );
  }

  return (
    <>
      <div
        className={cn(
          "fixed z-[60] left-4 right-4 sm:left-auto sm:right-6 sm:w-[360px]",
          // Sits above the mobile cart bar and clears the iOS home indicator.
          "bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]",
          "animate-in slide-in-from-bottom-4 fade-in duration-300",
        )}
        role="dialog"
        aria-label={t("pwa.installTitle")}
      >
        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 p-5">
          <button
            onClick={dismiss}
            aria-label={t("pwa.dismiss")}
            className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900 leading-tight">
                {t("pwa.installTitle")}
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t("pwa.installSubtitle")}
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-1.5">
            {[t("pwa.benefitFullScreen"), t("pwa.benefitOneTap"), t("pwa.benefitFaster")].map((b) => (
              <li key={b} className="flex items-center gap-2 text-[11px] text-slate-500">
                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                {b}
              </li>
            ))}
          </ul>

          <div className="flex gap-2 mt-4">
            <button
              onClick={dismiss}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors active:scale-[0.98]"
            >
              {t("pwa.notNow")}
            </button>
            <button
              onClick={handleInstall}
              className="flex-[1.6] h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98] shadow-sm shadow-indigo-200"
            >
              <Download className="h-4 w-4" />
              {deferred ? t("pwa.install") : t("pwa.howToInstall")}
            </button>
          </div>
        </div>
      </div>

      <HowToDialog
        open={howToOpen}
        onClose={() => { setHowToOpen(false); dismiss(); }}
        platform={platform}
      />
    </>
  );
}
