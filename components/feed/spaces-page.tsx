"use client";

import {
  Activity,
  Atom,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  Code2,
  Compass,
  Dna,
  Flame,
  FlaskConical,
  Heart,
  Layers,
  Palette,
  Search,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PostCard } from "./post-card";
import { Post } from "./types";

export interface PolaTag {
  id: string;
  label: string;
  labelKu: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  bgGlow: string;
  borderHover: string;
  description: string;
  stats: string;
  memberCount: string;
  isTrending?: boolean;
}

export const POLA_TAGS: PolaTag[] = [
  {
    id: "developer",
    label: "developer",
    labelKu: "پرۆگرامەرەکان",
    icon: Code2,
    color: "text-violet-400",
    gradient: "from-violet-600/25 via-indigo-600/15 to-transparent",
    bgGlow: "bg-violet-500/10",
    borderHover: "hover:border-violet-500/40",
    description: "گەشەپێدەرانی وێب، ئەپڵیکەیشن، زیرەکی دەستکرد و سیستەم",
    stats: "٣٤٠+ سات",
    memberCount: "٢.٤ هەزار بەشداربوو",
    isTrending: true,
  },
  {
    id: "graphic_designer",
    label: "graphic_designer",
    labelKu: "دیزاینەرەکان",
    icon: Palette,
    color: "text-pink-400",
    gradient: "from-pink-600/25 via-rose-600/15 to-transparent",
    bgGlow: "bg-pink-500/10",
    borderHover: "hover:border-pink-500/40",
    description: "دیزاینی گرافیک، ڕووکاری بەکارهێنەر UI/UX و هونەری دیجیتاڵ",
    stats: "٢١٠+ سات",
    memberCount: "١.٨ هەزار بەشداربوو",
    isTrending: true,
  },
  {
    id: "programming",
    label: "programming",
    labelKu: "کۆدنووسی و ئەلگۆریتم",
    icon: Layers,
    color: "text-sky-400",
    gradient: "from-sky-600/25 via-blue-600/15 to-transparent",
    bgGlow: "bg-sky-500/10",
    borderHover: "hover:border-sky-500/40",
    description: "تەکنیکەکانی کۆدکردن، بنەماکانی داتابەیس و ئەندازیاری نەرمەکاڵا",
    stats: "١٨٠+ سات",
    memberCount: "١.٢ هەزار بەشداربوو",
  },
  {
    id: "Architecture",
    label: "Architecture",
    labelKu: "تەلارسازی و بیناسازی",
    icon: Building2,
    color: "text-amber-400",
    gradient: "from-amber-600/25 via-orange-600/15 to-transparent",
    bgGlow: "bg-amber-500/10",
    borderHover: "hover:border-amber-500/40",
    description: "تەلارسازی هاوچەرخ، شێوازی شارستانی، دیزاینی ناوەوە و ئەندازیاری",
    stats: "١٥٠+ سات",
    memberCount: "٩٥٠ بەشداربوو",
  },
  {
    id: "Medical",
    label: "Medical",
    labelKu: "پزیشکی و تەندروستی",
    icon: Heart,
    color: "text-rose-400",
    gradient: "from-rose-600/25 via-red-600/15 to-transparent",
    bgGlow: "bg-rose-500/10",
    borderHover: "hover:border-rose-500/40",
    description: "زانستی پزیشکی، دەرمانسازی، تەندروستی گشتی و دۆزینەوە نوێیەکان",
    stats: "١٣٠+ سات",
    memberCount: "١.١ هەزار بەشداربوو",
    isTrending: true,
  },
  {
    id: "sports",
    label: "sports",
    labelKu: "وەرزش و لەشجوانی",
    icon: Trophy,
    color: "text-emerald-400",
    gradient: "from-emerald-600/25 via-teal-600/15 to-transparent",
    bgGlow: "bg-emerald-500/10",
    borderHover: "hover:border-emerald-500/40",
    description: "تۆپی پێ، لەشجوانی، شاخەوانی و چالاکییە وەرزشییەکان",
    stats: "٢٩٠+ سات",
    memberCount: "٣.١ هەزار بەشداربوو",
  },
  {
    id: "History",
    label: "History",
    labelKu: "مێژوو و شوێنەوار",
    icon: BookOpen,
    color: "text-amber-500",
    gradient: "from-amber-700/25 via-yellow-600/15 to-transparent",
    bgGlow: "bg-amber-500/10",
    borderHover: "hover:border-amber-500/40",
    description: "مێژووی کوردستان و جیهان، بەڵگەنامە کۆنەکان و شارستانییەتەکان",
    stats: "٩٥+ سات",
    memberCount: "٨٤٠ بەشداربوو",
  },
  {
    id: "Chemistry",
    label: "Chemistry",
    labelKu: "کیمیا و زانست",
    icon: FlaskConical,
    color: "text-teal-400",
    gradient: "from-teal-600/25 via-cyan-600/15 to-transparent",
    bgGlow: "bg-teal-500/10",
    borderHover: "hover:border-teal-500/40",
    description: "کیمیای تاقیگەیی، گەردیلەکان، پیشەسازی دەرمان و تاقیکردنەوەکان",
    stats: "٧٠+ سات",
    memberCount: "٥٢٠ بەشداربوو",
  },
  {
    id: "Biology",
    label: "Biology",
    labelKu: "بایۆلۆژی و ژینگە",
    icon: Dna,
    color: "text-lime-400",
    gradient: "from-lime-600/25 via-emerald-600/15 to-transparent",
    bgGlow: "bg-lime-500/10",
    borderHover: "hover:border-lime-500/40",
    description: "زانستی ژیان، خانەکان، جیهانی ئاژەڵان، ڕووەکەکان و پاراستنی سروشت",
    stats: "٨٥+ سات",
    memberCount: "٦١٠ بەشداربوو",
  },
  {
    id: "Sport",
    label: "Sport",
    labelKu: "ئەتلەتیک و یارییەکان",
    icon: Atom,
    color: "text-indigo-400",
    gradient: "from-indigo-600/25 via-purple-600/15 to-transparent",
    bgGlow: "bg-indigo-500/10",
    borderHover: "hover:border-indigo-500/40",
    description: "ڕاکردن، پێشبڕکێ نێودەوڵەتییەکان، ئۆڵۆمپیاد و چالاکی تایبەت",
    stats: "١١٠+ سات",
    memberCount: "٧٨٠ بەشداربوو",
  },
];

interface SpacesPageProps {
  posts: Post[];
  onLikeToggle?: (postId: string) => void;
  onAddComment?: (postId: string, commentText: string) => void;
  onEditPost?: (postId: string, newContent: string) => void;
  onDeletePost?: (postId: string) => void;
  onOpenDialog?: (post: Post) => void;
}

export function SpacesPage({
  posts,
  onLikeToggle,
  onAddComment,
  onEditPost,
  onDeletePost,
  onOpenDialog,
}: SpacesPageProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState<"hot" | "latest">("hot");
  const [isOtherOpen, setIsOtherOpen] = useState(false);
  const otherDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        otherDropdownRef.current &&
        !otherDropdownRef.current.contains(event.target as Node)
      ) {
        setIsOtherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4 primary tags shown in the bar so all pills fit comfortably without overflowing
  const primaryTags = useMemo(() => POLA_TAGS.slice(0, 4), []);
  // Remaining tags accessible under "بوارەکانی تر"
  const otherTags = useMemo(() => POLA_TAGS.slice(4), []);

  const activeTagInfo = useMemo(() => {
    return POLA_TAGS.find((t) => t.id === activeTag) || null;
  }, [activeTag]);

  // Check if active tag is from "otherTags"
  const isOtherActive = useMemo(() => {
    return otherTags.some((t) => t.id === activeTag);
  }, [otherTags, activeTag]);

  // Filtered posts
  const displayedPosts = useMemo(() => {
    let result = posts;

    // Filter by tag if selected
    if (activeTag) {
      result = result.filter((post) =>
        post.tags?.some(
          (tag) =>
            tag.toLowerCase() === activeTag.toLowerCase() ||
            tag.toLowerCase().replace(/_/g, "") === activeTag.toLowerCase().replace(/_/g, "")
        )
      );
    }

    // Filter by search query if present
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.content?.toLowerCase().includes(q) ||
          p.author.name?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortFilter === "hot") {
      return [...result].sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount));
    }
    return result;
  }, [posts, activeTag, searchQuery, sortFilter]);

  return (
    <div dir="rtl" className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-6 text-right select-none font-sans">
      {/* Header Container */}
      <div className="relative z-10 rounded-3xl border border-border/70 bg-card/90 backdrop-blur-xl p-5 sm:p-7 mb-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          {/* Title & Subtitle */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-primary" />
                کۆمەڵگە و کایە زیندووەکانی پۆلا
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              بوارەکان
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              هاوبەشی لەگەڵ پسپۆڕان و داهێنەرانی کورد بکە؛ گەشت بکە لە نێو زانست، تەکنەلۆژیا، وەرزش و هونەر.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72 relative shrink-0">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان لە نێو بوار و ساتەکاندا..."
              className="w-full rounded-2xl border border-border/80 bg-background/70 py-2.5 pr-10 pl-9 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 backdrop-blur-md transition-all text-right shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="سڕینەوەی گەڕان"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Horizontal Flow Pill Bar - Flex Wrap ensures pills ALWAYS stay inside the box */}
        <div className="mt-6 pt-5 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-2">
            {/* All Spaces Pill */}
            <button
              onClick={() => setActiveTag(null)}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTag === null
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-background/80 text-muted-foreground hover:text-foreground border border-border/60 hover:bg-muted/40"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>هەموو بوارەکان</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTag === null
                    ? "bg-background/20 text-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {posts.length}
              </span>
            </button>

            {/* Primary Category Pills */}
            {primaryTags.map((tag) => {
              const Icon = tag.icon;
              const isActive = activeTag === tag.id;
              return (
                <button
                  key={tag.id}
                  onClick={() => setActiveTag(isActive ? null : tag.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-background/80 text-muted-foreground hover:text-foreground border border-border/60 hover:bg-muted/40"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-background" : tag.color}`} />
                  <span>{tag.labelKu}</span>
                  {tag.isTrending && (
                    <Flame className="h-3 w-3 text-amber-500 fill-amber-500" />
                  )}
                </button>
              );
            })}

            {/* "Other Category" Selector Dropdown */}
            <div className="relative inline-block shrink-0" ref={otherDropdownRef}>
              <button
                type="button"
                onClick={() => setIsOtherOpen(!isOtherOpen)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                  isOtherActive && activeTagInfo
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : isOtherOpen
                    ? "border-border bg-muted text-foreground"
                    : "border-border/70 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {isOtherActive && activeTagInfo ? (
                  <>
                    <activeTagInfo.icon className="h-3.5 w-3.5 text-background" />
                    <span>{activeTagInfo.labelKu}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTag(null);
                        setIsOtherOpen(false);
                      }}
                      className="inline-flex items-center justify-center p-0.5 rounded-full hover:bg-background/20"
                      title="لابردنی فلتەر"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </>
                ) : (
                  <>
                    <span>بوارەکانی تر</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isOtherOpen ? "rotate-180" : ""
                      }`}
                    />
                  </>
                )}
              </button>

              {/* Dropdown Menu - Guaranteed 100% Opaque Solid Background, No Ghosting/Transparency */}
              <AnimatePresence>
                {isOtherOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 6 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-border bg-white dark:bg-[#18181b] text-foreground p-2 shadow-2xl z-50 text-right ring-1 ring-black/10 dark:ring-white/10"
                  >
                    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-muted-foreground border-b border-border/60 mb-1.5">
                      <span>هەڵبژاردنی بوارەکانی تر</span>
                      <span className="text-[10px] font-medium text-muted-foreground/70">
                        {otherTags.length} بوار
                      </span>
                    </div>

                    <div className="space-y-1 max-h-[420px] overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-0.5">
                      {otherTags.map((tag) => {
                        const Icon = tag.icon;
                        const isSelected = activeTag === tag.id;
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              setActiveTag(isSelected ? null : tag.id);
                              setIsOtherOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-right ${
                              isSelected
                                ? "bg-primary/15 text-primary font-bold"
                                : "text-foreground hover:bg-muted/80"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/50 ${tag.bgGlow} ${tag.color}`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex flex-col text-right">
                                <span className="font-bold leading-tight">
                                  {tag.labelKu}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  #{tag.label}
                                </span>
                              </div>
                            </div>

                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Stream Section Header (relative z-10 so dropdown above at z-40 floats cleanly) */}
      <div className="relative z-10 flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            {activeTag ? `ساتەکانی ${activeTagInfo?.labelKu}` : "ساتە زیندووەکانی پۆلا"}
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {displayedPosts.length} سات
          </span>
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline mr-1 cursor-pointer"
            >
              (لابردنی فلتەر)
            </button>
          )}
        </div>

        {/* Sort Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card/60 p-1">
          <button
            onClick={() => setSortFilter("hot")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sortFilter === "hot"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flame className="h-3 w-3" />
            <span>گەرمترین</span>
          </button>
          <button
            onClick={() => setSortFilter("latest")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sortFilter === "latest"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>نوێترین</span>
          </button>
        </div>
      </div>

      {/* Feed List (Directly displayed under the header) */}
      <div className="space-y-4">
        {displayedPosts.length > 0 ? (
          displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLikeToggle={onLikeToggle}
              onAddComment={onAddComment}
              onEditPost={onEditPost}
              onDeletePost={onDeletePost}
              onOpenDialog={onOpenDialog}
            />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/30 py-16 px-6 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 border border-border/60 text-muted-foreground mb-3">
              <Compass className="h-7 w-7 text-primary" />
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1">
              هیچ ساتێک لەم بوارەدا نەدۆزرایەوە
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-4">
              ئەم بوارە چاوەڕوانی یەکەم دەنگدانەوەی تۆیە! بیرۆکەکەت یان پرۆژەکەت لەگەڵ کۆمەڵگە هاوبەش بکە.
            </p>
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="flex items-center gap-1.5 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span>گەڕانەوە بۆ هەموو بوارەکان</span>
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
