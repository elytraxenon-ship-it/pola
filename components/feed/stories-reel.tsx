"use client";

import { ChevronLeft, LoaderCircle, Plus, Sparkles, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageCropDialog } from "@/components/profile/image-crop-dialog";
import { compressStoryImage, cropImageToAspect } from "@/lib/image-compress";
import { useLanguage } from "@/lib/language-context";
import { Story, User } from "./types";

interface StoriesReelProps {
  currentUser: User;
}

interface StoryGroup {
  author: User;
  stories: Story[];
}

const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
const STORY_FRAME_MS = 6000;

export function StoriesReel({ currentUser }: StoriesReelProps) {
  const { language, dir } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [caption, setCaption] = useState("");
  const [showStoryDeleteConfirm, setShowStoryDeleteConfirm] = useState(false);
  const [isDeletingStory, setIsDeletingStory] = useState(false);
  const [viewer, setViewer] = useState<{ groupIndex: number; storyIndex: number } | null>(null);

  const groups = useMemo<StoryGroup[]>(() => {
    const byAuthor = new Map<string, StoryGroup>();
    for (const story of stories) {
      const group = byAuthor.get(story.author.id) || { author: story.author, stories: [] };
      group.stories.push(story);
      byAuthor.set(story.author.id, group);
    }
    for (const group of byAuthor.values()) {
      group.stories.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    }
    return [...byAuthor.values()].sort((a, b) =>
      Date.parse(b.stories[b.stories.length - 1].createdAt) -
      Date.parse(a.stories[a.stories.length - 1].createdAt)
    );
  }, [stories]);

  const activeStory = viewer ? groups[viewer.groupIndex]?.stories[viewer.storyIndex] : null;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stories", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load stories");
        if (Array.isArray(data)) setStories(data);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Could not load stories:", error);
          toast.add({ title: "نەتوانرا ساتەکان باربکرێن", type: "error" });
        }
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!preparedFile) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(preparedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [preparedFile]);

  const scroll = (direction: -1 | 1) => {
    scrollContainerRef.current?.scrollBy({ left: direction * 240, behavior: "smooth" });
  };

  const handleStoryFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.add({ title: "تەنها وێنە ڕێگەپێدراوە", description: "ڤیدیۆ و جۆری پەڕگەی تر بۆ سات قبوڵ ناکرێت.", type: "error" });
      return;
    }
    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      toast.add({ title: "قەبارەی وێنە زۆرە", description: "وێنەیەک هەڵبژێرە کە لە ٢٠ مێگابایت بچووکترە.", type: "error" });
      return;
    }
    setCaption("");
    setCropFile(file);
  };

  const prepareStory = async (x: number, y: number) => {
    if (!cropFile) return;
    setIsPreparing(true);
    try {
      const portrait = await cropImageToAspect(cropFile, 9 / 16, x, y);
      const optimized = await compressStoryImage(portrait);
      setPreparedFile(new File([optimized], "story.webp", { type: "image/webp" }));
      setCropFile(null);
      setShowPreview(true);
    } catch (error) {
      toast.add({
        title: "نەتوانرا وێنەکە ئامادە بکرێت",
        description: error instanceof Error ? error.message : "تکایە وێنەیەکی تر هەڵبژێرە.",
        type: "error",
      });
    } finally {
      setIsPreparing(false);
    }
  };

  const cancelStoryPreview = () => {
    if (isPublishing) return;
    setShowPreview(false);
    setPreparedFile(null);
    setCaption("");
  };

  const publishStory = async () => {
    if (!preparedFile || isPublishing) return;
    setIsPublishing(true);
    try {
      const body = new FormData();
      body.append("file", preparedFile, "story.webp");
      body.append("caption", caption.trim());
      const response = await fetch("/api/stories", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "نەتوانرا ساتەکە بڵاو بکرێتەوە");
      setStories((previous) => [...previous.filter((story) => story.id !== data.id), data]);
      setShowPreview(false);
      setPreparedFile(null);
      setCaption("");
      toast.add({ title: "ساتەکەت بۆ ٢٤ کاتژمێر بڵاوکرایەوە ✨", type: "success" });
    } catch (error) {
      toast.add({
        title: "نەتوانرا ساتەکە بڵاو بکرێتەوە",
        description: error instanceof Error ? error.message : "هەوڵ بدەرەوە.",
        type: "error",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const advanceViewer = useCallback((direction: -1 | 1) => {
    setViewer((current) => {
      if (!current) return null;
      const group = groups[current.groupIndex];
      const withinGroup = current.storyIndex + direction;
      if (withinGroup >= 0 && withinGroup < group.stories.length) {
        return { ...current, storyIndex: withinGroup };
      }
      const nextGroupIndex = current.groupIndex + direction;
      if (nextGroupIndex < 0 || nextGroupIndex >= groups.length) return null;
      const nextGroup = groups[nextGroupIndex];
      return { groupIndex: nextGroupIndex, storyIndex: direction > 0 ? 0 : nextGroup.stories.length - 1 };
    });
  }, [groups]);

  useEffect(() => {
    if (!activeStory || showStoryDeleteConfirm) return;
    const remainingLifetime = Date.parse(activeStory.expiresAt) - Date.now();
    if (!Number.isFinite(remainingLifetime) || remainingLifetime <= 0) {
      setStories((previous) => previous.filter((story) => story.id !== activeStory.id));
      setViewer(null);
      return;
    }
    const advance = () => {
      if (remainingLifetime <= STORY_FRAME_MS) {
        setStories((previous) => previous.filter((story) => story.id !== activeStory.id));
        setViewer(null);
        return;
      }
      advanceViewer(1);
    };
    const timer = window.setTimeout(advance, Math.min(STORY_FRAME_MS, remainingLifetime));
    return () => window.clearTimeout(timer);
  }, [activeStory?.id, activeStory?.expiresAt, advanceViewer, showStoryDeleteConfirm]);

  useEffect(() => {
    if (!viewer) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") advanceViewer(dir === "rtl" ? -1 : 1);
      if (event.key === "ArrowLeft") advanceViewer(dir === "rtl" ? 1 : -1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewer, advanceViewer, dir]);

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) return;
    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      advanceViewer((dx > 0) === (dir === "rtl") ? 1 : -1);
    }
  };

  const myGroup = groups.findIndex((group) => group.author.id === currentUser.id);
  const canDeleteActiveStory = Boolean(activeStory && (
    activeStory.author.id === currentUser.id || activeStory.author.handle === currentUser.handle
  ));

  const deleteActiveStory = async () => {
    if (!activeStory || isDeletingStory) return;
    setIsDeletingStory(true);
    try {
      const response = await fetch(`/api/stories/${encodeURIComponent(activeStory.id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "نەتوانرا ساتەکە بسڕدرێتەوە");
      setStories((previous) => previous.filter((story) => story.id !== activeStory.id));
      setViewer(null);
      setShowStoryDeleteConfirm(false);
      toast.add({ title: language === "en" ? "Story deleted" : "ساتەکە سڕایەوە", type: "success" });
    } catch (error) {
      toast.add({
        title: language === "en" ? "Could not delete story" : "نەتوانرا ساتەکە بسڕدرێتەوە",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsDeletingStory(false);
    }
  };

  return (
    <section className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-3 shadow-xs backdrop-blur-sm sm:p-4" aria-label="ساتەکانی ٢٤ کاتژمێر">
      <input
        ref={storyInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={handleStoryFile}
      />

      <div className="mb-3 flex flex-col gap-1 px-1 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground sm:text-sm">
          <Sparkles className="size-4 shrink-0 text-amber-500" />
          <span>لێدانی ڕاستەوخۆ و ساتەکان</span>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">دوای ٢٤ کاتژمێر نامێنێت</span>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex w-full min-w-0 items-start gap-3 overflow-x-auto overscroll-x-contain pb-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
      >
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div className="relative isolate">
            <button
              type="button"
              onClick={() => myGroup >= 0 && setViewer({ groupIndex: myGroup, storyIndex: 0 })}
              className={`rounded-full p-[2px] ${myGroup >= 0 ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600" : "bg-border/80"}`}
              aria-label={myGroup >= 0 ? "بینینی ساتەکانی تۆ" : "ساتێک زیاد بکە"}
            >
              <span className="block rounded-full bg-card p-[2px]">
                <img src={currentUser.avatar} alt="" className="size-14 rounded-full bg-muted object-cover sm:size-16" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => storyInputRef.current?.click()}
              className="absolute bottom-0 right-0 z-10 grid size-6 place-items-center rounded-full border-2 border-card bg-foreground text-background shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:size-7"
              aria-label="زیادکردنی سات"
              title="زیادکردنی سات"
            >
              <Plus className="size-3 stroke-[2.75] sm:size-3.5" />
            </button>
          </div>
          <span className="max-w-16 truncate text-center text-[11px] font-medium text-foreground">{myGroup >= 0 ? "ساتەکانی تۆ" : "ساتێک زیاد بکە"}</span>
        </div>

        {groups.map((group, groupIndex) => {
          if (group.author.id === currentUser.id) return null;
          return (
            <button
              type="button"
              key={group.author.id}
              onClick={() => setViewer({ groupIndex, storyIndex: 0 })}
              className="group flex shrink-0 flex-col items-center gap-1.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`بینینی ساتەکانی ${group.author.name}`}
            >
              <span className="rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2.5px] transition-transform group-hover:scale-105">
                <span className="block rounded-full bg-card p-[2px]">
                  <img src={group.author.avatar} alt="" loading="lazy" className="size-14 rounded-full bg-muted object-cover sm:size-16" />
                </span>
              </span>
              <span className="max-w-16 truncate text-center text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                {group.author.name.split(" ")[0]}
              </span>
            </button>
          );
        })}

        {!isLoading && stories.length === 0 && (
          <p className="self-center py-4 text-xs text-muted-foreground">
            {language === "en"
              ? "Follow people to see their stories, or add your own."
              : "کەسانێک فۆڵۆ بکە تاکو ساتەکانیان ببینیت، یان ساتێکی خۆت زیاد بکە."}
          </p>
        )}
        {isLoading && <div className="size-14 shrink-0 animate-pulse rounded-full bg-muted sm:size-16" aria-label="بارکردنی ساتەکان" />}
      </div>

      <button
        type="button"
        onClick={() => scroll(dir === "rtl" ? 1 : -1)}
        className="absolute left-1 top-1/2 z-10 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/95 shadow-md transition-colors hover:bg-muted md:grid"
        aria-label="گەڕان بەناو ساتەکاندا"
      >
        <ChevronLeft className="size-4" />
      </button>

      <Dialog open={showPreview} onOpenChange={(open) => { if (!open) cancelStoryPreview(); }}>
        <DialogContent dir={dir} className="max-h-[94dvh] w-[calc(100%-1rem)] max-w-md overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-2xl p-3 sm:p-5" showCloseButton={!isPublishing}>
          <DialogHeader>
            <DialogTitle className="text-right text-base font-bold">پێشبینینی سات</DialogTitle>
            <p className="text-right text-xs leading-relaxed text-muted-foreground">
              {language === "en"
                ? "Only your followers can see this story for 24 hours."
                : "تەنها فۆڵۆەرەکانت ئەم ساتە بۆ ٢٤ کاتژمێر دەبینن."}
            </p>
          </DialogHeader>
          <div className="relative mx-auto h-[min(48dvh,30rem)] max-w-full aspect-[9/16] overflow-hidden rounded-xl bg-black sm:h-[min(54dvh,34rem)]">
            {previewUrl && <img src={previewUrl} alt="پێشبینینی سات" className="size-full object-cover" />}
            {caption.trim() && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-4 pt-12 sm:px-5 sm:pb-5">
                <p className="whitespace-pre-wrap break-words text-center text-sm font-semibold leading-relaxed text-white drop-shadow sm:text-base">{caption.trim()}</p>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="story-caption" className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span>{language === "en" ? "Caption" : "دەقی سات"}</span>
              <span className="text-xs font-normal text-muted-foreground">{Array.from(caption).length}/٢٨٠</span>
            </label>
            <textarea
              id="story-caption"
              value={caption}
              onChange={(event) => setCaption(Array.from(event.target.value).slice(0, 280).join(""))}
              maxLength={560}
              rows={2}
              placeholder={language === "en" ? "Add a little context… (optional)" : "دەقێکی کورت زیاد بکە... (ئارەزوومەندانە)"}
              disabled={isPublishing}
              className="min-h-20 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-60"
            />
            <p className="text-xs text-muted-foreground">{language === "en" ? "Your caption appears over the story image." : "دەقەکەت لەسەر وێنەی ساتەکە دەردەکەوێت."}</p>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={cancelStoryPreview} disabled={isPublishing} className="min-h-11 sm:w-auto">پاشگەزبوونەوە</Button>
            <Button type="button" onClick={publishStory} disabled={!preparedFile || isPublishing} className="min-h-11 gap-2 sm:w-auto">
              {isPublishing && <LoaderCircle className="size-4 animate-spin" />}
              {isPublishing ? "خەریکی بڵاوکردنەوەیە..." : "بڵاوکردنەوەی سات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(activeStory)} onOpenChange={(open) => { if (!open) setViewer(null); }}>
        <DialogContent dir={dir} className="w-[calc(100%-1rem)] max-w-md overflow-hidden rounded-2xl border-0 bg-black p-0 text-white shadow-2xl sm:w-full" showCloseButton={false}>
          {activeStory && viewer && (
            <div
              className="relative mx-auto aspect-[9/16] max-h-[88dvh] w-[min(100%,49.5dvh)] touch-pan-y overflow-hidden bg-black"
              onPointerDown={(event) => { pointerStart.current = { x: event.clientX, y: event.clientY }; }}
              onPointerUp={onPointerUp}
              onPointerCancel={() => { pointerStart.current = null; }}
            >
              <img src={activeStory.mediaUrl} alt={`سات لەلایەن ${activeStory.author.name}`} className="absolute inset-0 size-full select-none object-contain" draggable={false} />
              <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
                {groups[viewer.groupIndex].stories.map((story, index) => (
                  <span key={story.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/35">
                    {index < viewer.storyIndex && <span className="block h-full w-full bg-white" />}
                    {index === viewer.storyIndex && (
                      <motion.span className="block h-full bg-white" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: STORY_FRAME_MS / 1000, ease: "linear" }} />
                    )}
                  </span>
                ))}
              </div>
              <div className="absolute inset-x-3 top-7 z-10 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <img src={activeStory.author.avatar} alt="" className="size-9 shrink-0 rounded-full border border-white/50 bg-muted object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{activeStory.author.name}</p>
                    <p className="text-[10px] text-white/75">{new Date(activeStory.createdAt).toLocaleTimeString(language === "en" ? "en" : "ckb", { hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {canDeleteActiveStory && <button type="button" onClick={() => setShowStoryDeleteConfirm(true)} className="grid size-10 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-rose-600/80" aria-label={language === "en" ? "Delete story" : "سڕینەوەی سات"}><Trash2 className="size-4" /></button>}
                  <button type="button" onClick={() => setViewer(null)} className="grid size-10 place-items-center rounded-full bg-black/40 text-white" aria-label={language === "en" ? "Close story" : "داخستن"}><X className="size-5" /></button>
                </div>
              </div>

              <button type="button" onClick={() => advanceViewer(dir === "rtl" ? 1 : -1)} className="absolute inset-y-20 left-0 z-[5] w-1/3" aria-label="ساتێکی پێشوو" />
              <button type="button" onClick={() => advanceViewer(dir === "rtl" ? -1 : 1)} className="absolute inset-y-20 right-0 z-[5] w-2/3" aria-label="ساتێکی داهاتوو" />
              {activeStory.caption && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] bg-gradient-to-t from-black/85 via-black/40 to-transparent px-5 pb-7 pt-16">
                  <p className="whitespace-pre-wrap break-words text-center text-sm font-semibold leading-relaxed text-white drop-shadow sm:text-base">{activeStory.caption}</p>
                </div>
              )}
              <AnimatePresence>
                {showStoryDeleteConfirm && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alertdialog" aria-modal="true" className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div dir={dir} className="w-full max-w-xs rounded-2xl border border-white/15 bg-neutral-950/95 p-4 text-center shadow-2xl">
                      <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-rose-500/15 text-rose-400"><Trash2 className="size-5" /></span>
                      <p className="text-sm font-bold">{language === "en" ? "Delete this story?" : "ئەم ساتە بسڕدرێتەوە؟"}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/65">{language === "en" ? "It will no longer be visible to your followers." : "ئیتر فۆڵۆەرەکانت ناتوانن ئەم ساتە ببینن."}</p>
                      <div className="mt-4 flex gap-2">
                        <button type="button" disabled={isDeletingStory} onClick={() => setShowStoryDeleteConfirm(false)} className="min-h-10 flex-1 rounded-full border border-white/20 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50">{language === "en" ? "Keep story" : "ساتەکە بهێڵەوە"}</button>
                        <button type="button" disabled={isDeletingStory} onClick={deleteActiveStory} className="min-h-10 flex-1 rounded-full bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">{isDeletingStory ? (language === "en" ? "Deleting…" : "دەسڕێتەوە...") : (language === "en" ? "Delete" : "بسڕەوە")}</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {isPreparing && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/35 backdrop-blur-[1px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-2 rounded-full bg-card px-4 py-3 text-sm shadow-xl"><LoaderCircle className="size-4 animate-spin" /> وێنەکە ئامادە دەکرێت...</div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageCropDialog
        file={cropFile}
        kind="story"
        isSaving={isPreparing}
        onCancel={() => { if (!isPreparing) setCropFile(null); }}
        onConfirm={prepareStory}
      />
    </section>
  );
}
