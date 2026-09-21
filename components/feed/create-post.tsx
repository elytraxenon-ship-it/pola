"use client";

import {
  Camera,
  Globe2,
  Image as ImageIcon,
  Mic,
  Radio,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Avatar10 } from "@/components/motion/avatar";
import { Button } from "@/components/motion/button";
import { toast } from "@/components/ui/toast";
import { CURRENT_USER } from "./dummy-data";
import { Post } from "./types";

interface CreatePostProps {
  onAddPost?: (newPost: Post) => void;
}

export function CreatePost({ onAddPost }: CreatePostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedTag, setSelectedTag] = useState("PolaVibes");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tags = ["PolaVibes", "UIDesign", "CreatorLab", "TechEchoes", "VisualJournal"];

  const handleSubmit = () => {
    if (!content.trim()) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const newPost: Post = {
        id: `post-${Date.now()}`,
        author: CURRENT_USER,
        timestamp: "Just now",
        privacy: "public",
        content: content.trim(),
        tags: [selectedTag],
        likesCount: 1,
        commentsCount: 0,
        sharesCount: 0,
        isLiked: true,
        isSaved: false,
        comments: [],
      };

      onAddPost?.(newPost);
      setContent("");
      setIsSubmitting(false);
      setIsOpen(false);

      // Trigger Toast as specified in task.md
      toast.add({
        title: "ساتەکەت بڵاوکرایەوە! 🚀",
        description: "بڵاوکراوەکەت ئێستا لەسەر پۆلا بەردەستە.",
        type: "success",
      });
    }, 500);
  };

  return (
    <>
      {/* Studio Bar Trigger */}
      <div className="w-full rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs transition-all">
        <div className="flex items-center gap-3">
          <Avatar10
            name={CURRENT_USER.name}
            avatar={CURRENT_USER.avatar}
            size="size-10"
            online={true}
          />
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-right text-xs md:text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground cursor-pointer"
          >
            بیرۆکەیەک، هەستێک یان ساتێک لە پۆلا دەرببڕە...
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
            >
              <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
              <span>میدیا</span>
            </button>

            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
            >
              <Mic className="h-3.5 w-3.5 text-rose-500" />
              <span>تۆماری دەنگی</span>
            </button>

            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>دەنگدانەوە</span>
            </button>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
            پەخشی گشتی
          </span>
        </div>
      </div>

      {/* Pola Studio Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl text-right"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    دروستکردنی بڵاوکراوەی نوێ
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Author Row */}
              <div className="flex items-center gap-3 py-3">
                <Avatar10
                  name={CURRENT_USER.name}
                  avatar={CURRENT_USER.avatar}
                  size="size-9.5"
                  online={true}
                />
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {CURRENT_USER.name}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Globe2 className="h-3 w-3" />
                    <span>کۆمەڵگەی گشتی</span>
                  </div>
                </div>
              </div>

              {/* Text Input */}
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ئەمڕۆ چی لە هزرتدا دەزرینگێتەوە؟ ساتەکانت بنووسە..."
                rows={4}
                className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none text-right leading-relaxed"
              />

              {/* Tag Selector */}
              <div className="flex flex-wrap gap-1.5 py-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedTag === tag
                        ? "bg-foreground text-background font-semibold"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              {/* Submit Row */}
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <button className="rounded-lg p-1.5 hover:bg-muted hover:text-foreground transition-colors">
                    <ImageIcon className="h-4 w-4 text-emerald-500" />
                  </button>
                  <button className="rounded-lg p-1.5 hover:bg-muted hover:text-foreground transition-colors">
                    <Smile className="h-4 w-4 text-amber-500" />
                  </button>
                  <button className="rounded-lg p-1.5 hover:bg-muted hover:text-foreground transition-colors">
                    <Camera className="h-4 w-4 text-cyan-500" />
                  </button>
                </div>

                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!content.trim() || isSubmitting}
                  className="rounded-full px-5 text-xs font-semibold"
                >
                  {isSubmitting ? "خەریکی بڵاوکردنەوەیە..." : "بڵاوکردنەوەی ساتەکە"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
