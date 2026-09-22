"use client";

import {
  ArrowRight,
  Check,
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

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { t } = useLanguage();
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

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-3 sm:px-6 py-4 text-right">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-5 border-b border-border/70 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs"
            title="گەڕانەوە"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              ڕێکخستنەکان
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              تایبەتمەندی و شێوازی دەرکەوتنی ڕووکار
            </p>
          </div>
        </div>
      </div>

      {/* Main Appearance Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs space-y-6"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Palette className="h-4 w-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              شێوازی ڕووکار
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 mr-10">
            شێوازی دەرکەوتنی تۆڕی پۆلا هەڵبژێرە بەپێی حەزی خۆت.
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
              <div className="space-y-1.5 text-right">
                <div className="h-2 w-3/4 rounded-full bg-zinc-300" />
                <div className="h-1.5 w-1/2 rounded-full bg-zinc-200" />
              </div>
              <div className="h-3 w-full rounded-md bg-zinc-100 flex items-center px-1.5">
                <div className="h-1.5 w-8 rounded-full bg-zinc-400" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-foreground">ڕۆشنایی</span>
            </div>

            {theme === "light" && (
              <div className="absolute top-2.5 left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
              <div className="space-y-1.5 text-right">
                <div className="h-2 w-3/4 rounded-full bg-zinc-600" />
                <div className="h-1.5 w-1/2 rounded-full bg-zinc-700" />
              </div>
              <div className="h-3 w-full rounded-md bg-zinc-800 flex items-center px-1.5">
                <div className="h-1.5 w-8 rounded-full bg-zinc-500" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Moon className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-foreground">تاریک</span>
            </div>

            {theme === "dark" && (
              <div className="absolute top-2.5 left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
              <div className="space-y-1.5 text-right">
                <div className="h-2 w-3/4 rounded-full bg-zinc-400" />
                <div className="h-1.5 w-1/2 rounded-full bg-zinc-500" />
              </div>
              <div className="h-3 w-full rounded-md bg-zinc-400/20 flex items-center px-1.5">
                <div className="h-1.5 w-8 rounded-full bg-zinc-300" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Laptop className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-foreground">سیستەم</span>
            </div>

            {theme === "system" && (
              <div className="absolute top-2.5 left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
