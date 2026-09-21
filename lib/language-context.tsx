"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "ckb" | "en";

interface Translations {
  [key: string]: {
    ckb: string;
    en: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Navigation & Channels
  feed: { ckb: "دەریای ساتەکان", en: "Moments Pulse" },
  forYou: { ckb: "هەڵبژێردراو بۆ تۆ", en: "For You" },
  sparks: { ckb: "پڕدەنگدانەوە", en: "Trending" },
  live: { ckb: "پەخشی ڕاستەوخۆ", en: "Live Broadcast" },
  spheres: { ckb: "بواری دروستکەران", en: "Creator Spheres" },
  lounges: { ckb: "ژوورە دەنگییەکان", en: "Audio Lounges" },
  archive: { ckb: "پاشەکەوتکراوەکان", en: "Saved Items" },
  global: { ckb: "ڕاداری جیهانی", en: "Global Radar" },
  stats: { ckb: "کاریگەریی تۆ", en: "Your Impact" },
  settings: { ckb: "ڕێکخستنەکان", en: "Settings" },

  // Navbar Buttons
  newMoment: { ckb: "ساتێک", en: "Moment" },
  notifications: { ckb: "ئاگادارکردنەوەکان", en: "Notifications" },
  messages: { ckb: "وتووێژ و نامەکان", en: "Messages" },
  viewProfile: { ckb: "بینینی پڕۆفایل", en: "View Profile" },
  logout: { ckb: "چوونەدەرەوە", en: "Log Out" },
  searchPlaceholder: {
    ckb: "گەڕان لە بیرۆکە، سات و دروستکەران...",
    en: "Search ideas, moments & creators...",
  },

  // Settings
  settingsTitle: { ckb: "ڕێکخستنەکان", en: "Settings" },
  settingsSubtitle: {
    ckb: "تایبەتمەندییەکانی ڕووکار و زمان",
    en: "Appearance & language preferences",
  },
  appearance: { ckb: "شێوازی ڕووکار", en: "Appearance" },
  appearanceSubtitle: { ckb: "Appearance & Theme", en: "Theme & Display" },
  appearanceDesc: {
    ckb: "شێوازی دەرکەوتنی تۆڕی پۆلا هەڵبژێرە بەپێی حەزی خۆت.",
    en: "Customize how Pola looks on your device.",
  },
  language: { ckb: "زمان", en: "Language" },
  languageSubtitle: { ckb: "Language & Locale", en: "Interface Language" },
  languageDesc: {
    ckb: "زمانی دڵخوازی خۆت بۆ ڕووکاری پۆلا دیاریبکە.",
    en: "Select your preferred language for Pola.",
  },
  light: { ckb: "ڕۆشنایی", en: "Light" },
  dark: { ckb: "تاریک", en: "Dark" },
  system: { ckb: "سیستەم", en: "System" },
  back: { ckb: "گەڕانەوە", en: "Back" },
  backToStream: { ckb: "گەڕانەوە بۆ دەریای ساتەکان", en: "Back to Feed" },

  // Profile
  editProfile: { ckb: "دەستکاریی پڕۆفایل", en: "Edit Profile" },
  share: { ckb: "هاوبەشکردن", en: "Share" },
  activeInPola: { ckb: "چالاک لە پۆلا", en: "Active in Pola" },
  posts: { ckb: "ساتەکان", en: "Moments" },
  media: { ckb: "میدیا", en: "Media" },
  spheresTab: { ckb: "بوارەکان", en: "Spheres" },
  followers: { ckb: "شوێنکەوتووان", en: "Followers" },
  following: { ckb: "شوێنکەوتوو", en: "Following" },
  impactScore: { ckb: "نمرەی کاریگەری", en: "Impact Score" },

  // Sidebar
  trendingSpheres: { ckb: "بوارە گەرمەکان", en: "Trending Spheres" },
  footerTagline: {
    ckb: "دیزاین کراوە بۆ دروستکەرانی هۆشیار",
    en: "Crafted for mindful creators",
  },

  // Languages options
  kurdishSorani: { ckb: "کوردی (سۆرانی)", en: "Kurdish (Sorani)" },
  englishUS: { ckb: "ئینگلیزی (ویلایەتە یەکگرتووەکان)", en: "English (United States)" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "rtl" | "ltr";
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "ckb",
  setLanguage: () => {},
  dir: "rtl",
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ckb");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      // Clear legacy test value if it was saved
      localStorage.removeItem("pola_language");

      const savedLang = localStorage.getItem("pola_language_selected") as Language | null;
      if (savedLang === "en" || savedLang === "ckb") {
        setLanguageState(savedLang);
        applyLanguage(savedLang);
      } else {
        // By default, Kurdish is always selected
        setLanguageState("ckb");
        applyLanguage("ckb");
      }
    } catch {
      setLanguageState("ckb");
      applyLanguage("ckb");
    }
    setMounted(true);
  }, []);

  const applyLanguage = (lang: Language) => {
    const isLtr = lang === "en";
    document.documentElement.dir = isLtr ? "ltr" : "rtl";
    document.documentElement.lang = isLtr ? "en" : "ckb";
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    applyLanguage(lang);
    try {
      localStorage.setItem("pola_language_selected", lang);
    } catch {}
  };

  const dir: "rtl" | "ltr" = language === "en" ? "ltr" : "rtl";

  const t = (key: string): string => {
    if (TRANSLATIONS[key]) {
      return TRANSLATIONS[key][language] || TRANSLATIONS[key]["ckb"] || key;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
