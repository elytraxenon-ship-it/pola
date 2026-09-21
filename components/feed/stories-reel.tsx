"use client";

import { ChevronLeft, Plus, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import { CURRENT_USER, DUMMY_STORIES } from "./dummy-data";

export function StoriesReel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -240, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full rounded-2xl border border-border/70 bg-card/60 p-3 shadow-xs backdrop-blur-sm">
      <div className="flex items-center justify-between px-1 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>لێدانی ڕاستەوخۆ و ساتەکان</span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          دوای ٢٤ کاتژمێر نامێنێت
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex w-full items-center gap-3.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {/* User Pulse Creator */}
        <div className="group flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
          <div className="relative p-0.5">
            <div className="relative rounded-full p-[2px] bg-transparent">
              <div className="rounded-full bg-card p-[2px]">
                <div className="relative size-14 rounded-full overflow-hidden bg-muted">
                  <img
                    src={CURRENT_USER.avatar}
                    alt={CURRENT_USER.name}
                    className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>

            {/* Plus Action Button */}
            <div
              className="absolute bottom-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card shadow-xs transition-transform duration-200 group-hover:scale-110"
              title="زیادکردنی سات"
            >
              <Plus className="size-3.5 stroke-[3]" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-foreground text-center group-hover:text-primary transition-colors">
            لێدانی تۆ
          </span>
        </div>

        {/* Dynamic Creator Pulses (Sarah, Marcus, etc.) */}
        {DUMMY_STORIES.map((story) => (
          <motion.div
            key={story.id}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
            className="group flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <div className="relative p-0.5">
              {/* Perfectly Centered Story Ring */}
              <div
                className={`relative rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105 ${
                  story.hasUnseen
                    ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs shadow-rose-500/25"
                    : "bg-border/80"
                }`}
              >
                {/* Inner White/Card Gap */}
                <div className="rounded-full bg-card p-[2px]">
                  <div className="relative size-14 rounded-full overflow-hidden bg-muted">
                    <img
                      src={story.authorAvatar}
                      alt={story.authorName}
                      className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>

              {/* Unseen Live Dot */}
              {story.hasUnseen && (
                <span className="absolute bottom-1 right-1 size-2.5 rounded-full bg-rose-500 ring-2 ring-card animate-pulse" />
              )}
            </div>

            <span className="max-w-[68px] truncate text-[11px] font-medium text-muted-foreground group-hover:text-foreground text-center transition-colors">
              {story.authorName.split(" ")[0]}
            </span>
          </motion.div>
        ))}
      </div>

      {/* RTL Scroll Navigation Button (Located safely on the left in RTL) */}
      <button
        onClick={scrollLeft}
        className="absolute -left-2.5 top-1/2 -translate-y-1/2 hidden md:flex size-8 items-center justify-center rounded-full border border-border bg-card shadow-md hover:bg-muted transition-all z-10 cursor-pointer"
        aria-label="بڕۆ پێشەوە"
        title="بڕۆ پێشەوە"
      >
        <ChevronLeft className="h-4 w-4 text-foreground" />
      </button>
    </div>
  );
}
