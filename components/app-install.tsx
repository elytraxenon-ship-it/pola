"use client";

import { Download, X } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/language-context";

interface InstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallContext = createContext<(() => void) | null>(null);
const DISMISS_KEY = "pola-install-dismiss-until";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const STANDALONE_QUERY = "(display-mode: standalone), (display-mode: minimal-ui), (display-mode: window-controls-overlay)";

const instructions = {
  ios: {
    en: ["Open the browser’s Share menu. If needed, open Pola in Safari first.", "Choose Add to Home Screen. Turn on Open as Web App if shown, then tap Add."],
    ckb: ["مێنیوی هاوبەشکردن بکەرەوە. ئەگەر پێویست بوو، سەرەتا پۆلا لە Safari بکەرەوە.", "Add to Home Screen هەڵبژێرە. ئەگەر Open as Web App دەرکەوت، چالاکی بکە و پاشان Add دابگرە."],
  },
  safari: {
    en: ["On macOS Sonoma or later, open File or the Share menu in Safari.", "Choose Add to Dock, then click Add."],
    ckb: ["لە macOS Sonoma یان نوێتر، مێنیوی File یان هاوبەشکردن لە Safari بکەرەوە.", "Add to Dock هەڵبژێرە و پاشان Add دابگرە."],
  },
  android: {
    en: ["Open the browser menu (⋮). If Pola opened inside another app, choose Open in browser first.", "Choose Install app or Add to Home screen, then follow the browser’s steps."],
    ckb: ["مێنیوی وێبگەڕ (⋮) بکەرەوە. ئەگەر پۆلا لە ناو ئەپێکی تر کراوەتەوە، سەرەتا Open in browser هەڵبژێرە.", "Install app یان Add to Home screen هەڵبژێرە و هەنگاوەکانی وێبگەڕەکە جێبەجێ بکە."],
  },
  embedded: {
    en: ["Use the menu to open Pola in your browser, or copy the link and paste it there.", "On iPhone or iPad, use Safari’s Share menu. On Android, use the browser menu to install or add to your home screen."],
    ckb: ["لە مێنیوەکەوە پۆلا لە وێبگەڕ بکەرەوە، یان بەستەرەکە کۆپی بکە و لە وێبگەڕ بیخەرەوە.", "لە ئایفۆن و ئایپاد مێنیوی هاوبەشکردنی Safari بەکاربهێنە. لە ئەندرۆید مێنیوی وێبگەڕ بۆ دامەزراندن یان زیادکردن بۆ شاشەی سەرەکی بەکاربهێنە."],
  },
  desktop: {
    en: ["Look for the install icon in the address bar, or open the browser menu and look for Install, Apps, or Add to taskbar.", "If your browser offers no install option, open Pola in Chrome, Edge, Brave, or Safari on a compatible Mac."],
    ckb: ["لە شریتی ناونیشان بگەڕێ بۆ ئایکۆنی دامەزراندن، یان مێنیوی وێبگەڕ بکەرەوە و بگەڕێ بۆ Install، Apps یان Add to taskbar.", "ئەگەر هەڵبژاردەی دامەزراندن نییە، پۆلا لە Chrome، Edge، Brave یان Safari لە ماکێکی گونجاو بکەرەوە."],
  },
} as const;

function getInstallPlatform(): keyof typeof instructions {
  const { userAgent, maxTouchPoints } = navigator;
  if (/FBAN|FBAV|Instagram|Line\/|TikTok|Snapchat|Telegram|MicroMessenger|; wv\)/i.test(userAgent)) return "embedded";
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  if (/Macintosh.*Safari/i.test(userAgent) && !/Chrome|Chromium|Edg|OPR/i.test(userAgent)) return "safari";
  return "desktop";
}

function rememberDismissal() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
  } catch {
    // The current prompt can still be dismissed when storage is unavailable.
  }
}

export function useAppInstall() {
  return useContext(InstallContext);
}

export function AppInstallProvider({ children }: { children: ReactNode }) {
  const { language, dir } = useLanguage();
  const [available, setAvailable] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [platform, setPlatform] = useState<keyof typeof instructions>("desktop");
  const [nativePrompt, setNativePrompt] = useState<InstallPromptEvent | null>(null);
  const title = language === "en" ? "Install Pola" : "دامەزراندنی پۆلا";
  const closeLabel = language === "en" ? "Dismiss install suggestion" : "داخستنی پێشنیاری دامەزراندن";

  useEffect(() => {
    const displayMode = window.matchMedia(STANDALONE_QUERY);
    const isStandalone = () => displayMode.matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setNativePrompt(event as InstallPromptEvent);
    };
    const hideInstalledPrompt = () => {
      setAvailable(false);
      setNativePrompt(null);
      setShowBanner(false);
      setShowInstructions(false);
    };
    const handleInstalled = () => {
      window.clearTimeout(timer);
      rememberDismissal();
      hideInstalledPrompt();
    };
    const handleDisplayChange = () => {
      if (isStandalone()) hideInstalledPrompt();
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    displayMode.addEventListener?.("change", handleDisplayChange);

    const timer = window.setTimeout(() => {
      if (isStandalone()) return;
      setPlatform(getInstallPlatform());
      setAvailable(true);
      try {
        if (Number(localStorage.getItem(DISMISS_KEY)) > Date.now()) return;
      } catch {
        // The prompt remains usable when storage is unavailable.
      }
      setShowBanner(true);
    }, 1800);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Could not register the Pola service worker", error);
      });
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      displayMode.removeEventListener?.("change", handleDisplayChange);
    };
  }, []);

  const dismiss = () => {
    rememberDismissal();
    setShowBanner(false);
  };

  const openInstall = async () => {
    dismiss();
    if (nativePrompt) {
      setNativePrompt(null);
      try {
        await nativePrompt.prompt();
        return;
      } catch {
        // The browser may have invalidated the event since it was captured.
      }
    }
    setShowInstructions(true);
  };

  return (
    <InstallContext.Provider value={available ? openInstall : null}>
      {children}
      {available && showBanner && (
        <aside
          dir={dir}
          aria-label={title}
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[45] mx-auto flex max-w-md flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-lg"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Download aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-bold">{title}</p>
              <p className="text-xs text-muted-foreground">{language === "en" ? "Open Pola from your home screen." : "پۆلا ڕاستەوخۆ لەسەر ئامێرەکەت بکەرەوە."}</p>
            </div>
          </div>
          <button type="button" onClick={openInstall} className="min-h-10 shrink-0 rounded-full bg-foreground px-3 text-xs font-semibold text-background hover:opacity-85">
            {nativePrompt ? (language === "en" ? "Install" : "دامەزراندن") : (language === "en" ? "How to install" : "چۆنیەتی دامەزراندن")}
          </button>
          <button type="button" aria-label={closeLabel} onClick={dismiss} className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <X aria-hidden="true" className="size-4" />
          </button>
        </aside>
      )}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent dir={dir} className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader className="pe-8 text-start rtl:ps-8 rtl:pe-0">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {language === "en" ? "Use your browser’s menu to add Pola to your device." : "لە مێنیوی وێبگەڕەکەوە پۆلا زیاد بکە بۆ ئامێرەکەت."}
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 ps-5 text-sm leading-relaxed">
            {instructions[platform][language].map((step) => <li key={step}>{step}</li>)}
          </ol>
        </DialogContent>
      </Dialog>
    </InstallContext.Provider>
  );
}
