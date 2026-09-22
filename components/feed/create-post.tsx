"use client";

import {
  Camera,
  Globe2,
  Hash,
  Image as ImageIcon,
  Radio,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Avatar10 } from "@/components/motion/avatar";
import { Button } from "@/components/motion/button";
import { toast } from "@/components/ui/toast";
import { CURRENT_USER } from "./dummy-data";
import { POLA_TAGS } from "./spaces-page";
import { Post } from "./types";
import { useLanguage } from "@/lib/language-context";
import { compressPostImage } from "@/lib/image-compress";

interface CreatePostProps {
  onAddPost?: (newPost: Post) => void;
  autoOpen?: boolean;
  onAutoOpenHandled?: () => void;
  currentUser?: import("./types").User;
}

export function CreatePost({ onAddPost, autoOpen, onAutoOpenHandled, currentUser }: CreatePostProps) {
  const { dir } = useLanguage();
  const user = currentUser ?? CURRENT_USER;
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // # autocomplete state
  const [hashQuery, setHashQuery] = useState("");
  const [showHashMenu, setShowHashMenu] = useState(false);
  const hashMenuRef = useRef<HTMLDivElement>(null);

  // Open and focus when the navbar "ساتێک" button triggers autoOpen
  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
      onAutoOpenHandled?.();
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [autoOpen, onAutoOpenHandled]);

  const hashSuggestions = POLA_TAGS.filter(
    (t) =>
      !hashQuery ||
      t.id.toLowerCase().startsWith(hashQuery.toLowerCase()) ||
      t.labelKu.startsWith(hashQuery)
  );

  // Detect # typing in textarea
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Find if cursor is right after a #
    const pos = e.target.selectionStart ?? val.length;
    const before = val.slice(0, pos);
    const hashMatch = before.match(/#(\w*)$/);
    if (hashMatch) {
      setHashQuery(hashMatch[1]);
      setShowHashMenu(true);
    } else {
      setShowHashMenu(false);
      setHashQuery("");
    }
  };

  const handleSelectHashTag = (tagId: string) => {
    // Replace the partial #query with the chosen tag
    const pos = textareaRef.current?.selectionStart ?? content.length;
    const before = content.slice(0, pos);
    const after = content.slice(pos);
    const replaced = before.replace(/#(\w*)$/, `#${tagId} `);
    setContent(replaced + after);
    setSelectedTag(tagId);
    setShowHashMenu(false);
    setHashQuery("");
    // Re-focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPos = replaced.length;
      textareaRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Close hash menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (hashMenuRef.current && !hashMenuRef.current.contains(e.target as Node)) {
        setShowHashMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.add({
          title: "تەنها وێنە ڕێگەپێدراوە!",
          description: "بۆ پۆست تەنها فایلەکانی وێنە پەسەند دەکرێن، ڤیدیۆ ڕێگەپێدراو نییە.",
          type: "error",
        });
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaUrl && !selectedFile) return;
    setIsSubmitting(true);

    try {
      let finalMediaUrl: string | undefined = undefined;

      if (selectedFile) {
        // Compress client-side using pure Canvas API to reduce bandwidth
        const compressed = await compressPostImage(selectedFile);
        const formData = new FormData();
        formData.append("file", compressed, "post.webp");

        const uploadRes = await fetch("/api/upload/post", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || "نەتوانرا وێنەکە باربکرێت");
        }

        const uploadData = await uploadRes.json();
        finalMediaUrl = uploadData.url;
      } else if (mediaUrl && !mediaUrl.startsWith("blob:")) {
        finalMediaUrl = mediaUrl;
      }

      // Extract all tags from content (e.g. #developer #Medical)
      const mentionedTags = (content.match(/#(\w+)/g) || []).map((t) =>
        t.replace("#", "")
      );
      const finalTags =
        selectedTag && !mentionedTags.includes(selectedTag)
          ? [selectedTag, ...mentionedTags]
          : mentionedTags.length > 0
          ? mentionedTags
          : selectedTag
          ? [selectedTag]
          : [];

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          mediaUrl: finalMediaUrl,
          tags: finalTags,
          privacy: "public",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "هەڵەیەک ڕوویدا لە تۆمارکردندا");
      }

      const createdPost: Post = await res.json();
      onAddPost?.(createdPost);
      setContent("");
      setMediaUrl(null);
      setSelectedFile(null);
      setSelectedTag(null);
      setIsSubmitting(false);
      setIsOpen(false);
      toast.add({
        title: "ساتەکەت بڵاوکرایەوە! 🚀",
        description: "بڵاوکراوەکەت ئێستا لەسەر پۆلا بەردەستە.",
        type: "success",
      });
    } catch (err: any) {
      setIsSubmitting(false);
      toast.add({
        title: "هەڵە لە بڵاوکردنەوە",
        description: err.message || "نەتوانرا پۆستەکە تۆمار بکرێت",
        type: "error",
      });
    }
  };

  return (
    <>
      {/* Studio Bar Trigger */}
      <div className="w-full rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs transition-all">
        <div className="flex items-center gap-3">
          <Avatar10
            name={user.name}
            avatar={user.avatar}
            size="size-10"
            online={true}
          />
          <button
            onClick={() => setIsOpen(true)}
            className={`flex-1 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 ${
              dir === "rtl" ? "text-right" : "text-left"
            } text-xs md:text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground cursor-pointer`}
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
              <Hash className="h-3.5 w-3.5 text-primary" />
              <span>هاشتاگ</span>
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
              className={`relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl ${
                dir === "rtl" ? "text-right" : "text-left"
              }`}
            >
              {/* Header */}
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
                  name={user.name}
                  avatar={user.avatar}
                  size="size-9.5"
                  online={true}
                />
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {user.name}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Globe2 className="h-3 w-3" />
                    <span>کۆمەڵگەی گشتی</span>
                  </div>
                </div>
              </div>

              {/* Text Input with # autocomplete */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  autoFocus
                  value={content}
                  onChange={handleContentChange}
                  placeholder="ئەمڕۆ چی لە هزرتدا دەزرینگێتەوە؟ ساتەکانت بنووسە... (#بواریەک زیاد بکە)"
                  rows={4}
                  className={`w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none ${
                    dir === "rtl" ? "text-right" : "text-left"
                  } leading-relaxed`}
                />

                {/* # Autocomplete Dropdown */}
                <AnimatePresence>
                  {showHashMenu && hashSuggestions.length > 0 && (
                    <motion.div
                      ref={hashMenuRef}
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 450, damping: 28 }}
                      className="absolute bottom-full left-0 right-0 mb-2 z-10 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto"
                    >
                      <div className="p-1.5 space-y-0.5">
                        {hashSuggestions.map((tag) => {
                          const Icon = tag.icon;
                          return (
                            <button
                              key={tag.id}
                              onMouseDown={(e) => {
                                e.preventDefault(); // prevent blur
                                handleSelectHashTag(tag.id);
                              }}
                              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-right hover:bg-muted/70 transition-colors cursor-pointer group ${
                                selectedTag === tag.id ? "bg-muted/60" : ""
                              }`}
                            >
                              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/70 ${tag.color}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 text-right">
                                <div className="text-xs font-bold text-foreground">
                                  {tag.labelKu}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  #{tag.label}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tag Quick-Select Pills */}
              <div className="border-t border-border/40 pt-2 mt-1">
                <p className="text-[10px] text-muted-foreground mb-1.5">یان لەم بوارانە هەڵبژێرە:</p>
                <div className="flex flex-wrap gap-1.5">
                  {POLA_TAGS.map((tag) => {
                    const Icon = tag.icon;
                    const isSelected = selectedTag === tag.id;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          setSelectedTag(isSelected ? null : tag.id)
                        }
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                          isSelected
                            ? `bg-foreground text-background font-semibold`
                            : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className={`h-3 w-3 ${isSelected ? "" : tag.color}`} />
                        <span>#{tag.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hidden Image Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />

              {/* Uploaded Media Preview */}
              {mediaUrl && (
                <div className="relative mt-2 overflow-hidden rounded-xl border border-border/60 bg-muted/30 max-h-56">
                  <img
                    src={mediaUrl}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMediaUrl(null);
                      setSelectedFile(null);
                    }}
                    className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Submit Row */}
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg p-1.5 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    title="زیادکردنی وێنە"
                  >
                    <ImageIcon className="h-4 w-4 text-emerald-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg p-1.5 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    title="کامێرا"
                  >
                    <Camera className="h-4 w-4 text-cyan-500" />
                  </button>
                </div>

                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={(!content.trim() && !mediaUrl) || isSubmitting}
                  className="rounded-full px-5 text-xs font-semibold cursor-pointer"
                >
                  {isSubmitting
                    ? "خەریکی بڵاوکردنەوەیە..."
                    : "بڵاوکردنەوەی ساتەکە"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
