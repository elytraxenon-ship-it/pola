"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  OnboardingChecklist,
  type Step as ChecklistStep,
} from "@/components/onboarding-checklist";
import {
  AlertCircle,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  User,
} from "lucide-react";
import {
  isValidKurdishLocation,
  sanitizeKurdishLocation,
  VALID_KURDISH_CITIES,
} from "@/lib/kurdish-cities";
import { compressAvatar, compressBanner } from "@/lib/image-compress";

// ─── Kurdish City Geolocation ──────────────────────────────────────────────────
// Format MUST ALWAYS BE strictly: "شار، کوردستان"
const KURDISH_CITIES: Record<string, string> = {
  erbil: "هەولێر، کوردستان",
  arbil: "هەولێر، کوردستان",
  irbil: "هەولێر، کوردستان",
  hewler: "هەولێر، کوردستان",
  hawler: "هەولێر، کوردستان",
  sulaymaniyah: "سلێمانی، کوردستان",
  sulaimani: "سلێمانی، کوردستان",
  sulaimaniyah: "سلێمانی، کوردستان",
  slemani: "سلێمانی، کوردستان",
  "as sulaymaniyah": "سلێمانی، کوردستان",
  duhok: "دهۆک، کوردستان",
  dohuk: "دهۆک، کوردستان",
  dahuk: "دهۆک، کوردستان",
  kirkuk: "کەرکووک، کوردستان",
  karkuk: "کەرکووک، کوردستان",
  halabja: "هەڵەبجە، کوردستان",
  halabjah: "هەڵەبجە، کوردستان",
  zakho: "زاخۆ، کوردستان",
  zaxo: "زاخۆ، کوردستان",
  soran: "سۆران، کوردستان",
  diana: "سۆران، کوردستان",
  ranya: "ڕانیە، کوردستان",
  rania: "ڕانیە، کوردستان",
  kalar: "کەلار، کوردستان",
  chamchamal: "چەمچەماڵ، کوردستان",
  koya: "کۆیە، کوردستان",
  shaqlawa: "شەقڵاوە، کوردستان",
  rawanduz: "ڕەواندز، کوردستان",
  akre: "عەقرە، کوردستان",
  aqrah: "عەقرە، کوردستان",
  amadiyah: "ئامێدی، کوردستان",
  khanaqin: "خانەقین، کوردستان",
  kifri: "کفری، کوردستان",
  penjwin: "پێنجوێن، کوردستان",
  darbandikhan: "دەربەندیخان، کوردستان",
  bardarash: "بەردەڕەش، کوردستان",
  semel: "سێمێل، کوردستان",
  choman: "چۆمان، کوردستان",
};

function formatCityToKurdish(city: string, region: string): string {
  const combined = `${city || ""} ${region || ""}`.toLowerCase();
  for (const [key, val] of Object.entries(KURDISH_CITIES)) {
    if (combined.includes(key)) return val;
  }
  if (city && city.trim()) {
    return `${city.trim()}، کوردستان`;
  }
  return "هەولێر، کوردستان";
}

async function detectLocationFromIP(): Promise<{ location: string; isVpn: boolean }> {
  // 1. First try our local Next.js /api/geo endpoint (server-side, accurate, checks VPN)
  try {
    const res = await fetch("/api/geo", { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      return {
        location: data?.location || "هەولێر، کوردستان",
        isVpn: Boolean(data?.isVpn),
      };
    }
  } catch (err) {
    console.warn("Local /api/geo failed, trying client fallback:", err);
  }

  // 2. Client-side fallback to ipwho.is
  try {
    const res2 = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(3500) });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2 && (data2.city || data2.region)) {
        return {
          location: formatCityToKurdish(data2.city, data2.region),
          isVpn: false,
        };
      }
    }
  } catch (err2) {
    console.warn("Client geolocation fallback failed:", err2);
  }

  return {
    location: "هەولێر، کوردستان",
    isVpn: false,
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Form Fields
  const [userName, setUserName] = useState("");
  const [handle, setHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState("https://images.unsplash.com/photo-1707343843437-caacff5cfa74?auto=format&fit=crop&w=1600&q=80");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("هەولێر، کوردستان");
  const [locationLoading, setLocationLoading] = useState(true);
  const [isVpnBlocked, setIsVpnBlocked] = useState(false);
  const [recheckingVpn, setRecheckingVpn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ─── IP & VPN Detection ─────────────────────────────────────────────────────
  const checkVpnAndLocation = async () => {
    setLocationLoading(true);
    setRecheckingVpn(true);
    try {
      const res = await detectLocationFromIP();
      if (res.isVpn) {
        setIsVpnBlocked(true);
      } else {
        setIsVpnBlocked(false);
        if (res.location && res.location.includes("، کوردستان")) {
          setLocation(res.location);
        }
      }
    } catch (err) {
      console.error("VPN / Location check failed:", err);
    } finally {
      setLocationLoading(false);
      setRecheckingVpn(false);
    }
  };

  useEffect(() => {
    checkVpnAndLocation();
  }, []);

  // ─── Auth Guard & Data Prefill ──────────────────────────────────────────────
  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let currentUser = session?.user;

        if (!currentUser) {
          const { data: { user } } = await supabase.auth.getUser();
          currentUser = user ?? undefined;
        }

        if (!currentUser) {
          router.replace("/");
          return;
        }

        setUserId(currentUser.id);

        // Pre-fill name and avatar from Google OAuth metadata
        const name =
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split("@")[0] ||
          "";
        setUserName(name);

        const cleanHandle = (currentUser.email?.split("@")[0] || name)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "");
        setHandle(cleanHandle);

        const avatar =
          currentUser.user_metadata?.avatar_url ||
          currentUser.user_metadata?.picture ||
          "";
        if (avatar) {
          setAvatarUrl(avatar);
          setAvatarPreview(avatar);
        }

        // Check if user has already completed onboarding
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed, full_name, username, avatar_url, cover_url, bio, location")
          .eq("id", currentUser.id)
          .maybeSingle();

        // Only redirect to homepage if onboarding was explicitly completed
        if (profile && profile.onboarding_completed === true) {
          router.replace("/");
          return;
        }

        if (profile) {
          if (profile.full_name) setUserName(profile.full_name);
          if (profile.username) setHandle(profile.username);
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
            setAvatarPreview(profile.avatar_url);
          }
          if (profile.cover_url) {
            setCoverUrl(profile.cover_url);
            setCoverPreview(profile.cover_url);
          }
          if (profile.bio) setBio(profile.bio);
          // Only use saved location if it is custom and NOT the stale 'کوردستان' database default
          if (
            profile.location &&
            profile.location !== "کوردستان" &&
            profile.location !== "كوردستان" &&
            profile.location.includes("، کوردستان")
          ) {
            setLocation(profile.location);
          }
        }

        setLoadingAuth(false);
      } catch (err) {
        console.error("Auth init error in onboarding:", err);
        setLoadingAuth(false);
      }
    }

    initAuth();
  }, []);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // ─── Upload Handlers via Cloudflare R2 ──────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    try {
      setIsUploadingAvatar(true);
      // 1. Client-side canvas compression to max 200KB @ 400x400
      const compressed = await compressAvatar(file);

      // 2. Upload to Cloudflare R2 'avatar' bucket via API
      const formData = new FormData();
      formData.append("file", compressed, "avatar.webp");

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "هەڵە لە بارکردنی وێنە");
      }

      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
        setAvatarPreview(data.url);
      }
    } catch (err) {
      console.warn("Avatar R2 upload error, keeping local preview:", err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);

    try {
      setIsUploadingCover(true);
      // 1. Client-side canvas compression to max 500KB @ 1600x600
      const compressed = await compressBanner(file);

      // 2. Upload to Cloudflare R2 'banner' bucket via API
      const formData = new FormData();
      formData.append("file", compressed, "banner.webp");

      const res = await fetch("/api/upload/banner", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "هەڵە لە بارکردنی وێنەی بەرگ");
      }

      const data = await res.json();
      if (data.url) {
        setCoverUrl(data.url);
        setCoverPreview(data.url);
      }
    } catch (err) {
      console.warn("Cover R2 upload error, keeping local preview:", err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // ─── Save & Finish ──────────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);

    const sanitizedLoc = sanitizeKurdishLocation(location);
    if (!sanitizedLoc || !isValidKurdishLocation(sanitizedLoc)) {
      setError("تکایە شارێکی دروست هەڵبژێرە بە شێوازی (شار، کوردستان)");
      setSaving(false);
      setActiveStep(3);
      return;
    }

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: userName.trim() || undefined,
          username: handle.trim() || undefined,
          avatar_url: avatarUrl || undefined,
          cover_url: coverUrl || undefined,
          bio: bio.trim() || undefined,
          location: sanitizedLoc,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "هەڵەیەک لە پاشەکەوتکردندا ڕوویدا");
      }

      // Success -> redirect to homepage
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "هەڵەیەک لە سێرڤەردا ڕوویدا");
      setSaving(false);
    }
  };

  const isLocationValid = isValidKurdishLocation(location);
  const hasLatinInLocation = /[a-zA-Z]/.test(location);

  const advanceStep = (stepToAdvance = activeStep) => {
    // If advancing from Step 3, strictly block if location is not valid
    if (activeStep === 3) {
      if (!isLocationValid) {
        setError("تکایە شارێکی دروست هەڵبژێرە بە شێوازی (شار، کوردستان)");
        return;
      }
    }

    setError(null);
    setCompletedSteps((prev) => Array.from(new Set([...prev, stepToAdvance])));
    if (activeStep < 4) {
      setActiveStep((prev) => prev + 1);
    }
  };

  // Checklist dynamic steps definitions - starts at 0/4 and advances as user progresses
  const steps: ChecklistStep[] = [
    {
      id: 1,
      title: "دانانی وێنەی پڕۆفایل و بەرگ",
      description: "ئارەزوومەندانە",
      isCompleted: completedSteps.includes(1),
    },
    {
      id: 2,
      title: "ناوی تەواو و کورتەیەک دەربارەی خۆت",
      description: "ئارەزوومەندانە",
      isCompleted: completedSteps.includes(2),
    },
    {
      id: 3,
      title: "دیاریکردنی شار و شوێنی نیشتەجێبوون",
      description: isLocationValid ? location : "شارێکی دروست دیاریبکە",
      isCompleted: completedSteps.includes(3),
    },
    {
      id: 4,
      title: "پێداچوونەوە و دەستپێکردن",
      description: "دەستپێکردنی گەشتەکەت لە پۆلا",
      isCompleted: completedSteps.includes(4),
    },
  ];

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="text-2xl font-bold tracking-tight text-foreground animate-pulse">
            POLA
          </div>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full origin-left animate-pulse bg-primary" />
          </div>
        </div>
      </div>
    );
  }

  // VPN Access Blocker: blocks all access if connected through VPN or datacenter proxy
  if (isVpnBlocked) {
    return (
      <div
        dir="rtl"
        className="min-h-screen w-full flex items-center justify-center bg-background px-4 relative overflow-hidden"
      >
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(239,68,68,0.1),transparent)]" />
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-destructive/30 bg-card/95 backdrop-blur-md p-8 text-center space-y-6 shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert size={36} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              بەکارهێنانی VPN ڕێگەپێنەدراوە 🚫
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              تۆڕی پۆلا ڕێگە بە بەکارهێنانی VPN، پرۆکسی، یان ناونیشانی دەستکاریکراو نادات. تکایە بۆ ئەوەی بتوانیت بچیتە ناو پۆلا و شارەکەت بە دروستی دیاریبکرێت، تکایە VPNـەکەت بکوژێنەرەوە و دووبارە پشکنینەوە بکە.
            </p>
          </div>

          <button
            type="button"
            onClick={checkVpnAndLocation}
            disabled={recheckingVpn}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {recheckingVpn ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>لە پشکنیندایە...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>دووبارە پشکنینەوە</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-primary-foreground relative pb-16"
    >
      {/* Subtle Ambient Radial Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(168,85,247,0.08),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(168,85,247,0.15),transparent)]" />

      {/* Top Brand Bar */}
      <header className="relative z-10 mx-auto flex max-w-4xl items-center justify-between px-6 pt-6 sm:pt-8">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-foreground">POLA</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
            بەخێربێیت
          </span>
        </div>

        <div className="text-xs font-semibold text-muted-foreground">
          هەنگاوی <span className="font-mono text-foreground font-bold">{activeStep}</span> لە ٤
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-xl px-4 sm:px-6 pt-8 space-y-6">
        {/* Title and Intro */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            پڕۆفایلەکەت لە چەند هەنگاوێکدا ئامادە بکە
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            زانیارییەکانت دەستنیشان بکە تا هاوڕێکانت بە ئاسانی بتدۆزنەوە و دەست بە گەشتەکەت بکەیت.
          </p>
        </div>

        {/* The Exact Onboarding Checklist Component */}
        <div className="w-full">
          <OnboardingChecklist
            steps={steps}
            title="هەنگاوەکانی دەستپێکردن"
            activeStepId={activeStep}
            onSelectStep={(id) => {
              if (id === 4 && !isLocationValid) {
                setError("تکایە سەرەتا شارێکی دروست هەڵبژێرە بە شێوازی (شار، کوردستان)");
                setActiveStep(3);
                return;
              }
              if (activeStep === 3 && id > 3 && !isLocationValid) {
                setError("تکایە سەرەتا شارێکی دروست هەڵبژێرە بە شێوازی (شار، کوردستان)");
                return;
              }
              setError(null);
              setActiveStep(id);
            }}
            defaultExpanded={true}
          />
        </div>

        {/* Interactive Step Card Container */}
        <div className="w-full rounded-2xl md:rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-5 sm:p-7 shadow-sm">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Profile Photo & Cover ─────────────────────────────── */}
            {activeStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary" />
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      وێنەی پڕۆفایل و بەرگ
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    دانانی وێنەکان <span className="font-semibold text-foreground">ئارەزوومەندانەیە</span>، دەتوانیت ئێستا دایبنێیت یان تێیبپەڕێنیت.
                  </p>
                </div>

                {/* Cover Photo Box */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>وێنەی بەرگ (بەرگی سەرەوە)</span>
                    <span className="text-[11px] font-normal text-muted-foreground">ئارەزوومەندانە</span>
                  </label>
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="group relative h-28 sm:h-36 w-full cursor-pointer overflow-hidden rounded-2xl border border-dashed border-border bg-muted/50 hover:bg-muted/80 transition-all flex items-center justify-center select-none"
                  >
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverChange}
                    />
                    {coverPreview || coverUrl ? (
                      <>
                        <img
                          src={coverPreview || coverUrl}
                          alt="Cover preview"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-900 shadow-sm">
                            گۆڕینی وێنەی بەرگ
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-xs font-medium">کلیک بکە بۆ دیاریکردنی بەرگ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar Box */}
                <div className="flex items-center gap-4 pt-2">
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="group relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-border bg-muted hover:border-primary transition-all flex items-center justify-center select-none shadow-xs"
                  >
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    {avatarPreview ? (
                      <>
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="h-5 w-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Camera className="h-5 w-5" />
                        <span className="text-[10px] font-medium">وێنە</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">
                      وێنەی دەموجاو یان لۆگۆ
                    </h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                      دەتوانیت وێنەی هەژماری گووگڵەکەت بهێڵیتەوە یان وێنەیەکی نوێ باربکەیت.
                    </p>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer pt-1"
                    >
                      دیاریکردنی وێنە لە ئامێرەکەتەوە
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Name & Bio ─────────────────────────────────────────── */}
            {activeStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      دەربارەی خۆت
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ناوەکەت و کورتەیەک لەسەر خۆت یان کارەکانت بنووسە.
                  </p>
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex justify-between">
                    <span>ناوی تەواو</span>
                    <span className="text-[11px] font-normal text-muted-foreground">پێویستە</span>
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="نموونە: هۆگر ئەحمەد"
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-semibold"
                  />
                </div>

                {/* Username handle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex justify-between">
                    <span>ناوی بەکارهێنەر (Username)</span>
                    <span className="text-[11px] font-normal text-muted-foreground">بە ئینگلیزی</span>
                  </label>
                  <div className="relative" dir="ltr">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground">
                      @
                    </span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) =>
                        setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                      }
                      placeholder="username"
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-8 pr-3 text-xs sm:text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex justify-between">
                    <span>کورتەیەک دەربارەی خۆت (بایۆ)</span>
                    <span className="text-[11px] font-normal text-muted-foreground">ئارەزوومەندانە</span>
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={160}
                    placeholder="حەز و ئارەزووەکانت، پیشەکەت، یان سڵاوێک بۆ هاوڕێیانت لە پۆلا بنووسە..."
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none leading-relaxed"
                  />
                  <div className="text-left text-[11px] text-muted-foreground font-mono" dir="ltr">
                    {bio.length}/160
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Location ───────────────────────────────────────────── */}
            {activeStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      شار و شوێنی نیشتەجێبوون
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    بە شێوەیەکی خۆکارانە لەسەر بنەمای هێڵەکەت دیاریکراوە. دەتوانیت بیگۆڕیت بۆ هەر شارێکی تر.
                  </p>
                </div>

                {/* Detected Location Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    شوێنی ئێستات
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationLoading ? "لە دۆزینەوەدایە..." : location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        if (error) setError(null);
                      }}
                      disabled={locationLoading}
                      placeholder="هەولێر، کوردستان"
                      className={`w-full rounded-xl border py-2.5 pr-10 pl-4 text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                        !locationLoading && !isLocationValid
                          ? "border-destructive text-destructive bg-destructive/5 focus:ring-destructive/30"
                          : "border-border bg-background text-foreground focus:ring-primary/30"
                      }`}
                    />
                    <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${
                      !locationLoading && !isLocationValid ? "text-destructive" : "text-primary"
                    }`}>
                      {locationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : !isLocationValid ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {!locationLoading && (
                    isLocationValid ? (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                        <Check className="h-3.5 w-3.5" />
                        <span>شاری دروست هەڵبژێردراوە ✓ ({location})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-destructive font-semibold pt-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {hasLatinInLocation
                            ? `نووسینی ئینگلیزی/لاتینی ("${location}") قەدەغەیە! تەنها شارەکانی کوردستان بە کوردی (شار، کوردستان).`
                            : "ناونیشانی نادروست! پێویستە بە شێوازی (شار، کوردستان) بێت وەک نموونەکانی خوارەوە."}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Quick Kurdish Cities Grid */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-muted-foreground">
                    یان بە یەک کلیک شارەکەت هەڵبژێرە:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "هەولێر، کوردستان",
                      "سلێمانی، کوردستان",
                      "دهۆک، کوردستان",
                      "کەرکووک، کوردستان",
                      "هەڵەبجە، کوردستان",
                      "ڕانیە، کوردستان",
                      "کەلار، کوردستان",
                      "زاخۆ، کوردستان",
                      "سۆران، کوردستان",
                      "کۆیە، کوردستان",
                      "چەمچەماڵ، کوردستان",
                      "ئامێدی، کوردستان",
                    ].map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setLocation(city)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                          location === city
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border/80 bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Review & Complete ──────────────────────────────────── */}
            {activeStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
                    پڕۆفایلەکەت ئامادەیە! 🎉
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    سوپاس! هەموو شتێک ڕێکخرا. ئەوەش شێوازی دەرکەوتنی ناسنامەکەتە لە تۆڕی پۆلا:
                  </p>
                </div>

                {/* Live Profile Card Preview */}
                <div className="w-full rounded-2xl border border-border/80 bg-background overflow-hidden text-right shadow-sm">
                  {/* Cover */}
                  <div className="h-20 w-full overflow-hidden bg-muted relative">
                    <img
                      src={coverPreview || coverUrl}
                      alt="Cover preview"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Body with Avatar */}
                  <div className="p-4 pt-0 relative">
                    <div className="-mt-9 mb-2.5 h-16 w-16 rounded-full border-4 border-background overflow-hidden bg-muted shadow-md">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-bold text-xl">
                          {userName?.[0] || "P"}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-foreground text-sm sm:text-base">
                          {userName || "بەکارهێنەری پۆلا"}
                        </h3>
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono" dir="ltr">
                        <span>@{handle || "user"}</span>
                      </div>

                      <p className="text-xs text-foreground/80 pt-1 leading-relaxed">
                        {bio || "ئەندامی نوێی کۆمەڵگەی پۆلا ✨"}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                        <MapPin className="h-3 w-3 text-primary" />
                        {isLocationValid ? (
                          <span>{location}</span>
                        ) : (
                          <span className="text-destructive font-bold">شوێنی نادروست! تکایە بگەڕێوە بۆ هەنگاوی ٣</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-border/60">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => prev - 1)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                <span>گەڕانەوە</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={() => advanceStep()}
                  disabled={activeStep === 3 && (!isLocationValid || locationLoading)}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>هەنگاوی دواتر</span>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={saving || !isLocationValid}
                  className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>پاشەکەوت دەکرێت...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>دەستپێکردن و چوونە ناو پۆلا</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
          <Globe className="h-3 w-3" />
          <span>تۆڕی کۆمەڵایەتیی پۆلا لە کوردستان</span>
        </div>
      </main>
    </div>
  );
}
