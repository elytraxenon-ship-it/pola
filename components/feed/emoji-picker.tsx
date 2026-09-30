"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Hand, Heart, Smile, Sparkles } from "lucide-react";

const GROUPS = [
  { label: "زۆر بەکارهاتوو", icon: Sparkles, emojis: ["😂", "❤️", "😍", "🥰", "🔥", "👏", "👍", "🥹", "🤣", "😊", "🙏", "✨"] },
  { label: "دەموچاو", icon: Smile, emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "🥹", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "🤔", "🫡", "🥳", "😭", "😎", "🤗"] },
  { label: "دڵ", icon: Heart, emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🩷", "💖", "💘", "💝", "💞", "💕", "💓", "💗", "💯", "🔥", "✨", "🎉", "🥰", "😍", "😘", "💐"] },
  { label: "دەست", icon: Hand, emojis: ["👍", "👎", "👏", "🙌", "🤝", "🙏", "💪", "🤞", "✌️", "🫶", "👋", "👌", "🤘", "☝️", "🖐️", "✋", "🫡", "🤟", "👐", "🤲", "👊", "✊", "🫰", "🤙"] },
];

interface EmojiPickerProps {
  dir: "ltr" | "rtl";
  language: "en" | "ku" | "ckb";
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ dir, language, onSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const group = GROUPS[activeGroup];

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={rootRef}
      className={`absolute top-1/2 z-20 -translate-y-1/2 ${dir === "rtl" ? "left-3" : "right-3"}`}
    >
      <button
        type="button"
        aria-label={language === "en" ? "Choose an emoji" : "ئیمۆجییەک هەڵبژێرە"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`grid h-7 w-7 place-items-center rounded-full transition-all duration-200 ${
          isOpen
            ? "bg-primary/15 text-primary scale-110"
            : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:scale-110"
        }`}
      >
        <Smile className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            dir={dir}
            role="dialog"
            aria-label={language === "en" ? "Emoji picker" : "هەڵبژاردنی ئیمۆجی"}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 5 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={`absolute bottom-full mb-3 w-[min(320px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl ${
              dir === "rtl" ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-foreground">
                  {language === "en" ? "Add a little feeling" : "هەستێک زیاد بکە"}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {language === "en" ? "Pick one for your comment" : "ئیمۆجییەک بۆ لێدوانەکەت هەڵبژێرە"}
                </p>
              </div>
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            </div>

            <div className="mb-2 flex gap-1 rounded-xl bg-muted/60 p-1" role="tablist">
              {GROUPS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="tab"
                    aria-selected={activeGroup === index}
                    aria-label={language === "en" ? ["Popular", "Faces", "Hearts", "Hands"][index] : item.label}
                    onClick={() => setActiveGroup(index)}
                    className={`grid h-8 flex-1 place-items-center rounded-lg transition-colors ${
                      activeGroup === index ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>

            <p className="mb-1.5 text-[10px] font-semibold text-muted-foreground">{group.label}</p>
            <div className="grid max-h-40 grid-cols-8 gap-0.5 overflow-y-auto overscroll-contain sm:max-h-44">
              {group.emojis.map((emoji, index) => (
                <motion.button
                  key={`${emoji}-${index}`}
                  type="button"
                  whileHover={{ scale: 1.22, y: -2 }}
                  whileTap={{ scale: 0.86 }}
                  aria-label={`${language === "en" ? "Insert emoji" : "ئیمۆجی دابنێ"} ${emoji}`}
                  onClick={() => {
                    onSelect(emoji);
                    setIsOpen(false);
                  }}
                  className="grid aspect-square min-h-8 place-items-center rounded-lg text-xl transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
