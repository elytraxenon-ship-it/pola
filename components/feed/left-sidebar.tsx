"use client";

import {
  BarChart3,
  Bookmark,
  Globe2,
  Mic,
  Orbit,
  Radio,
  Settings,
  Sparkles,
} from "lucide-react";
import { Avatar10 } from "@/components/motion/avatar";
import { CURRENT_USER } from "./dummy-data";
import { User } from "./types";
import { useLanguage } from "@/lib/language-context";

interface LeftSidebarProps {
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  onViewProfile?: () => void;
  onOpenSettings?: () => void;
  currentUser?: User;
}

export function LeftSidebar({
  activeSection = "pulse",
  onSelectSection,
  onViewProfile,
  onOpenSettings,
  currentUser,
}: LeftSidebarProps) {
  const { language, dir, t } = useLanguage();
  const user = currentUser ?? CURRENT_USER;

  const channels = [
    { id: "pulse", label: t("feed"), icon: null, badge: language === "en" ? "Live" : "ڕاستەوخۆ", color: "text-amber-500", clickable: true },
    { id: "foryou", label: t("forYou"), icon: Sparkles, color: "text-purple-500", clickable: false },
    { id: "spheres", label: t("spheres"), icon: Orbit, color: "text-cyan-500", clickable: false },
    { id: "lounges", label: t("lounges"), icon: Mic, color: "text-rose-500", clickable: false },
    { id: "archive", label: t("archive"), icon: Bookmark, color: "text-emerald-500", clickable: false },
    { id: "global", label: t("global"), icon: Globe2, color: "text-blue-500", clickable: false },
    { id: "stats", label: t("stats"), icon: BarChart3, color: "text-orange-500", clickable: false },
    { id: "settings", label: t("settings"), icon: Settings, color: "text-zinc-500", clickable: true },
  ];

  return (
    <aside dir={dir} className={`sticky top-14 hidden lg:flex h-[calc(100vh-3.5rem)] w-68 flex-col gap-4 overflow-y-auto p-3 scrollbar-thin ${
      dir === "rtl" ? "text-right" : "text-left"
    }`}>
      {/* Profile Pill Card with Avatar10 */}
      <div
        onClick={onViewProfile}
        className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 shadow-2xs backdrop-blur-sm hover:bg-card hover:border-border transition-all cursor-pointer group"
      >
        <Avatar10
          name={user.name}
          avatar={user.avatar}
          size="size-11"
          online={true}
        />
        <div className="overflow-hidden flex-1">
          <div className="font-bold text-xs text-foreground truncate">
            {user.name}
          </div>
          <div className={`text-[11px] text-muted-foreground truncate font-sans ${dir === "rtl" ? "text-right" : "text-left"}`}>
            <span dir="ltr">{user.handle}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
            <Radio className="h-2.5 w-2.5" />
            <span>{t("activeInPola")}</span>
          </div>
        </div>
      </div>

      {/* Primary Channels */}
      <div className="flex flex-col gap-1">
        {channels.map((ch) => {
          const Icon = ch.icon;
          const isActive = ch.clickable && activeSection === ch.id;

          if (!ch.clickable) {
            return (
              <div
                key={ch.id}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground/50 cursor-default select-none"
              >
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground/40" />}
                  <span>{ch.label}</span>
                </div>
              </div>
            );
          }

          return (
            <button
              key={ch.id}
              onClick={() => {
                if (ch.id === "settings" && onOpenSettings) {
                  onOpenSettings();
                } else {
                  onSelectSection?.(ch.id);
                }
              }}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {Icon && <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-background" : ch.color}`} />}
                <span>{ch.label}</span>
              </div>
              {ch.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    isActive
                      ? "bg-background text-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {ch.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
