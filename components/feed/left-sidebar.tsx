"use client";

import {
  BarChart3,
  Bookmark,
  Flame,
  Globe2,
  Mic,
  Orbit,
  Radio,
  Sparkles,
} from "lucide-react";
import { Avatar10 } from "@/components/motion/avatar";
import { CURRENT_USER } from "./dummy-data";

interface LeftSidebarProps {
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  onViewProfile?: () => void;
}

export function LeftSidebar({
  activeSection = "pulse",
  onSelectSection,
  onViewProfile,
}: LeftSidebarProps) {
  const channels = [
    { id: "pulse", label: "دەریای ساتەکان", icon: Flame, badge: "ڕاستەوخۆ", color: "text-amber-500" },
    { id: "foryou", label: "هەڵبژێردراو بۆ تۆ", icon: Sparkles, color: "text-purple-500" },
    { id: "spheres", label: "بواری دروستکەران", icon: Orbit, badge: "١٢", color: "text-cyan-500" },
    { id: "lounges", label: "ژوورە دەنگییەکان", icon: Mic, color: "text-rose-500" },
    { id: "archive", label: "پاشەکەوتکراوەکان", icon: Bookmark, color: "text-emerald-500" },
    { id: "global", label: "ڕاداری جیهانی", icon: Globe2, color: "text-blue-500" },
    { id: "stats", label: "کاریگەریی تۆ", icon: BarChart3, color: "text-orange-500" },
  ];

  const spheres = [
    { id: "sp-1", name: "جووڵە و ڕووکاری زیرەک", count: "٢٤.٦ هەزار دەنگدانەوە" },
    { id: "sp-2", name: "تەلارسازی سادەگەری", count: "١٢.٨ هەزار دەنگدانەوە" },
    { id: "sp-3", name: "داهێنەرە سەربەخۆکان", count: "٣١.٢ هەزار دەنگدانەوە" },
  ];

  return (
    <aside className="sticky top-14 hidden lg:flex h-[calc(100vh-3.5rem)] w-68 flex-col gap-4 overflow-y-auto p-3 scrollbar-thin text-right">
      {/* Profile Pill Card with Avatar10 */}
      <div
        onClick={onViewProfile}
        className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 shadow-2xs backdrop-blur-sm hover:bg-card hover:border-border transition-all cursor-pointer group"
      >
        <Avatar10
          name={CURRENT_USER.name}
          avatar={CURRENT_USER.avatar}
          size="size-11"
          online={true}
        />
        <div className="overflow-hidden flex-1">
          <div className="font-bold text-xs text-foreground truncate">
            {CURRENT_USER.name}
          </div>
          <div dir="ltr" className="text-[11px] text-muted-foreground truncate font-sans text-right">
            {CURRENT_USER.handle}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
            <Radio className="h-2.5 w-2.5" />
            <span>چالاک لە پۆلا</span>
          </div>
        </div>
      </div>

      {/* Primary Channels */}
      <div className="flex flex-col gap-1">
        {channels.map((ch) => {
          const Icon = ch.icon;
          const isActive = activeSection === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => onSelectSection?.(ch.id)}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-background" : ch.color}`} />
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

      <div className="border-t border-border/60 my-0.5" />

      {/* Featured Spheres */}
      <div className="flex flex-col gap-1.5">
        <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          بوارە دیارەکان
        </div>
        {spheres.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-foreground/90 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted border border-border/50 text-foreground font-mono text-[10px] font-bold">
              ✦
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-[11px] font-semibold text-foreground truncate">
                {s.name}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {s.count}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto px-2 pt-3 text-[10px] text-muted-foreground/70 space-y-0.5">
        <p>POLA · تۆڕی کۆمەڵایەتیی نەوەی نوێ</p>
        <p className="text-muted-foreground/50">دیزاین کراوە بۆ دروستکەرانی هۆشیار</p>
      </div>
    </aside>
  );
}
