"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResultItem {
  id: string;
  title: string;
  category: string;
  verified?: boolean;
  image?: string;
  type: "entity" | "query";
  subtitle?: string;
}

const ALL_SEARCH_ITEMS: SearchResultItem[] = [
  {
    id: "s-1",
    title: "Mumbai Indians",
    category: "Sports team · 15M followers",
    verified: true,
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=150&q=80",
    type: "entity",
  },
  {
    id: "s-2",
    title: "Oh So Busy Mum",
    category: "Digital creator · 392K followers",
    verified: true,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    type: "entity",
  },
  {
    id: "s-3",
    title: "The Mummy",
    category: "Movie · 2.3M followers",
    verified: true,
    image: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=150&q=80",
    type: "entity",
  },
  {
    id: "s-4",
    title: "Mumford and Sons",
    category: "Musician/band · 4.4M followers",
    verified: true,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80",
    type: "entity",
  },
  {
    id: "s-5",
    title: "mumbai maharashtra",
    category: "Search query",
    type: "query",
  },
  {
    id: "s-6",
    title: "Sophia Martinez",
    category: "UI/UX Designer · 48K resonance",
    verified: true,
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    type: "entity",
  },
  {
    id: "s-7",
    title: "Sarah Chen",
    category: "Digital Architect · 128K vibes",
    verified: true,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    type: "entity",
  },
  {
    id: "s-8",
    title: "Pola Creative Lab",
    category: "Official Space · 54K members",
    verified: true,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    type: "entity",
  },
];

const INITIAL_RECENT_SEARCHES = [
  "Mumbai Indians",
  "Sarah Chen",
  "Pola Creative Lab",
  "Generative UI",
];

export function SearchDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(INITIAL_RECENT_SEARCHES);
  const [results, setResults] = useState<SearchResultItem[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: Escape to close, Cmd+K / Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle search filtering with realistic loading state UI
  useEffect(() => {
    if (!query.trim()) {
      setIsLoading(false);
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = ALL_SEARCH_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
      setResults(filtered.length > 0 ? filtered : [
        {
          id: `custom-${query}`,
          title: query,
          category: `گەڕان بۆ "${query}" لە پۆلا`,
          type: "query",
        }
      ]);
      setIsLoading(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  const handleSelectRecent = (item: string) => {
    setQuery(item);
  };

  const handleRemoveRecent = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((s) => s !== item));
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Normal Collapsed Search Input */}
      {!isOpen && (
        <div
          onClick={handleOpen}
          className="relative flex items-center cursor-pointer group"
        >
          <Search className="absolute right-3.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="گەڕان لە پۆلا..."
            className="h-9 w-44 md:w-64 lg:w-72 rounded-full border border-border/80 bg-muted/40 pr-9 pl-8 text-xs text-foreground placeholder:text-muted-foreground/70 group-hover:bg-muted/60 transition-all cursor-pointer text-right"
          />
          <span className="absolute left-3 hidden lg:inline-flex items-center rounded border border-border/80 bg-background/60 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground" dir="ltr">
            ⌘K
          </span>
        </div>
      )}

      {/* Facebook-style In-Place Search Dropdown Overlay */}
      {isOpen && (
        <div className="absolute top-[-4px] right-[-6px] z-50 w-80 md:w-96 rounded-2xl border border-border/80 bg-card p-3 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-98 duration-150 text-right">
          {/* Header Bar with Back Arrow and Search Input */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-border/50">
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="داخستنی گەڕان"
            >
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>

            <div className="relative flex flex-1 items-center">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="گەڕان لە پۆلا..."
                className="h-8.5 w-full rounded-full border border-border/60 bg-muted/40 px-3.5 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 text-right"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute left-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Body: Loading State vs Results vs Recent Searches */}
          <div className="max-h-[380px] overflow-y-auto pt-2 space-y-1 scrollbar-thin">
            {/* Loading State UI with Skeleton */}
            {isLoading && (
              <div className="space-y-2.5 p-1 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-1.5">
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <div className="space-y-1.5 flex-1 text-right">
                        <Skeleton className="h-3 w-28 ml-auto" />
                        <Skeleton className="h-2.5 w-40 ml-auto" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* Results State */}
            {!isLoading && query.trim() !== "" && (
              <div className="space-y-1">
                {results.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setRecentSearches((prev) => [
                        item.title,
                        ...prev.filter((s) => s !== item.title).slice(0, 5),
                      ]);
                      handleClose();
                    }}
                    className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-muted/60 transition-colors cursor-pointer group"
                  >
                    {/* Right in RTL: Circular Search Icon */}
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/70 text-muted-foreground group-hover:bg-muted group-hover:text-foreground transition-colors">
                        <Search className="h-4 w-4" />
                      </div>

                      {/* Middle: Title & Category Subtitle */}
                      <div className="overflow-hidden text-right">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                          <span>{item.title}</span>
                          {item.verified && (
                            <CheckCircle2 className="h-3.5 w-3.5 fill-blue-500 text-white shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {item.category}
                        </div>
                      </div>
                    </div>

                    {/* Left in RTL: Rounded Thumbnail / Image */}
                    {item.image && (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {!isLoading && query.trim() === "" && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className="text-xs font-bold text-foreground">
                    گەڕانە نوێیەکان
                  </span>
                  <button
                    type="button"
                    onClick={() => setRecentSearches([])}
                    className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                  >
                    سڕینەوەی هەمووی
                  </button>
                </div>

                {recentSearches.length > 0 ? (
                  recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => handleSelectRecent(term)}
                      className="flex items-center justify-between rounded-xl px-2.5 py-2 hover:bg-muted/60 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {term}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecent(term, e)}
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                        title="سڕینەوە لە مێژوو"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                    هیچ گەڕانێکی پێشوو نییە.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
