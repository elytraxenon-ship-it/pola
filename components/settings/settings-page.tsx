"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Languages,
  Laptop,
  Moon,
  Palette,
  Sun,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";

interface SettingsPageProps {
  onBack: () => void;
}

type ThemeMode = "light" | "dark" | "system";

interface LanguageOptionItem {
  id: "ckb" | "en";
  name: string;
  nativeName: string;
  code: string;
  flag: string;
  direction: "rtl" | "ltr";
}

const LANGUAGES: LanguageOptionItem[] = [
  {
    id: "ckb",
    name: "کوردی (سۆرانی)",
    nativeName: "Kurdish (Sorani)",
    code: "ckb",
    flag: "/flags/kurdistan.svg",
    direction: "rtl",
  },
  {
    id: "en",
    name: "English (United States)",
    nativeName: "ئینگلیزی (ئەمریکا)",
    code: "en",
    flag: "/flags/usa.svg",
    direction: "ltr",
  },
];

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { language, setLanguage, dir, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"appearance" | "language">("appearance");
  const [theme, setTheme] = useState<ThemeMode>("system");

  // Initialize theme from localStorage / DOM
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("pola_theme") as ThemeMode | null;
      if (savedTheme) {
        setTheme(savedTheme);
        applyTheme(savedTheme);
      } else {
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "dark" : "light");
      }
    } catch {}
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else if (mode === "light") {
      root.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem("pola_theme", newTheme);
    } catch {}
  };

  const handleLanguageChange = (newLang: "ckb" | "en") => {
    setLanguage(newLang);
  };

  return (
    <div dir={dir} className={`mx-auto max-w-4xl px-3 sm:px-6 py-4 ${dir === "rtl" ? "text-right" : "text-left"}`}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-5 border-b border-border/70 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs"
            title={t("back")}
          >
            {dir === "rtl" ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {t("settingsTitle")}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("settingsSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Grid Layout: Only 2 features */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation for Settings: EXACTLY 2 FEATURES */}
        <div className="md:col-span-4 space-y-1.5">
          <button
            onClick={() => setActiveTab("appearance")}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "appearance"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  activeTab === "appearance"
                    ? "bg-background/20 text-background"
                    : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                }`}
              >
                <Palette className="h-4 w-4" />
              </div>
              <div className={dir === "rtl" ? "text-right" : "text-left"}>
                <div className="font-bold">{t("appearance")}</div>
                <div
                  className={`text-[10px] ${
                    activeTab === "appearance" ? "text-background/80" : "text-muted-foreground"
                  }`}
                >
                  {t("appearanceSubtitle")}
                </div>
              </div>
            </div>
            {activeTab === "appearance" && (
              <div className="h-1.5 w-1.5 rounded-full bg-background shrink-0" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("language")}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "language"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  activeTab === "language"
                    ? "bg-background/20 text-background"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                }`}
              >
                <Languages className="h-4 w-4" />
              </div>
              <div className={dir === "rtl" ? "text-right" : "text-left"}>
                <div className="font-bold">{t("language")}</div>
                <div
                  className={`text-[10px] ${
                    activeTab === "language" ? "text-background/80" : "text-muted-foreground"
                  }`}
                >
                  {t("languageSubtitle")}
                </div>
              </div>
            </div>
            {activeTab === "language" && (
              <div className="h-1.5 w-1.5 rounded-full bg-background shrink-0" />
            )}
          </button>
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-8">
          {activeTab === "appearance" ? (
            /* 1. APPEARANCE SECTION */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-purple-500" />
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    {t("appearance")}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("appearanceDesc")}
                </p>
              </div>

              {/* Theme Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Light Theme Card */}
                <div
                  onClick={() => handleThemeChange("light")}
                  className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all flex flex-col items-center justify-between text-center gap-3 group ${
                    theme === "light"
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                      : "border-border/70 hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="w-full h-24 rounded-xl border border-zinc-200 bg-white p-2.5 flex flex-col justify-between shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="h-2 w-10 rounded-full bg-zinc-200" />
                      <div className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <div className="h-2 w-3/4 rounded-full bg-zinc-300" />
                      <div className="h-1.5 w-1/2 rounded-full bg-zinc-200" />
                    </div>
                    <div className="h-3 w-full rounded-md bg-zinc-100 flex items-center px-1.5">
                      <div className="h-1.5 w-8 rounded-full bg-zinc-400" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-foreground">{t("light")}</span>
                  </div>

                  {theme === "light" && (
                    <div
                      className={`absolute top-2.5 ${
                        dir === "rtl" ? "left-2.5" : "right-2.5"
                      } flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground`}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* Dark Theme Card */}
                <div
                  onClick={() => handleThemeChange("dark")}
                  className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all flex flex-col items-center justify-between text-center gap-3 group ${
                    theme === "dark"
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                      : "border-border/70 hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="w-full h-24 rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 flex flex-col justify-between shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="h-2 w-10 rounded-full bg-zinc-700" />
                      <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <div className="h-2 w-3/4 rounded-full bg-zinc-600" />
                      <div className="h-1.5 w-1/2 rounded-full bg-zinc-700" />
                    </div>
                    <div className="h-3 w-full rounded-md bg-zinc-800 flex items-center px-1.5">
                      <div className="h-1.5 w-8 rounded-full bg-zinc-500" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Moon className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-bold text-foreground">{t("dark")}</span>
                  </div>

                  {theme === "dark" && (
                    <div
                      className={`absolute top-2.5 ${
                        dir === "rtl" ? "left-2.5" : "right-2.5"
                      } flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground`}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* System Theme Card */}
                <div
                  onClick={() => handleThemeChange("system")}
                  className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all flex flex-col items-center justify-between text-center gap-3 group ${
                    theme === "system"
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                      : "border-border/70 hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="w-full h-24 rounded-xl border border-border bg-gradient-to-r from-zinc-100 to-zinc-900 p-2.5 flex flex-col justify-between shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="h-2 w-10 rounded-full bg-zinc-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <div className="h-2 w-3/4 rounded-full bg-zinc-400" />
                      <div className="h-1.5 w-1/2 rounded-full bg-zinc-500" />
                    </div>
                    <div className="h-3 w-full rounded-md bg-zinc-400/20 flex items-center px-1.5">
                      <div className="h-1.5 w-8 rounded-full bg-zinc-300" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Laptop className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold text-foreground">{t("system")}</span>
                  </div>

                  {theme === "system" && (
                    <div
                      className={`absolute top-2.5 ${
                        dir === "rtl" ? "left-2.5" : "right-2.5"
                      } flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground`}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* 2. LANGUAGE SECTION (Both CKB & EN, instant live switch to LTR / RTL) */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    {t("language")}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("languageDesc")}
                </p>
              </div>

              {/* Languages List: Both Kurdish and English */}
              <div className="space-y-3">
                {LANGUAGES.map((langItem) => {
                  const isSelected = language === langItem.id;
                  return (
                    <div
                      key={langItem.id}
                      onClick={() => handleLanguageChange(langItem.id)}
                      className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20"
                          : "border-border/70 hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 overflow-hidden border-2 ${
                            isSelected
                              ? "border-primary/40"
                              : "border-border/50"
                          }`}
                        >
                          <img
                            src={langItem.flag}
                            alt={langItem.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className={dir === "rtl" ? "text-right" : "text-left"}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {langItem.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{langItem.nativeName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
