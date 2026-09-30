"use client";

import { ArrowLeft, Clock, FileText, Search, SearchX, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";

interface SearchUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  subtitle: string;
}

interface SearchPost {
  id: string;
  content: string;
  mediaUrl: string | null;
  author: { id: string; name: string; avatar: string };
}

interface SearchDropdownProps {
  onViewProfile?: (id: string) => void;
  onOpenPost?: (id: string) => void;
}

const RECENT_SEARCHES_KEY = "pola:recent-searches:v1";
const MAX_RECENT_SEARCHES = 6;
const MIN_QUERY_LENGTH = 3;

export function SearchDropdown({ onViewProfile, onOpenPost }: SearchDropdownProps) {
  const { language, dir } = useLanguage();
  const isEnglish = language === "en";
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [settledQuery, setSettledQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [results, setResults] = useState<{ users: SearchUser[]; posts: SearchPost[] }>({ users: [], posts: [] });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
        const parsed: unknown = saved ? JSON.parse(saved) : [];
        if (Array.isArray(parsed)) setRecentSearches(parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT_SEARCHES));
      } catch {
        setRecentSearches([]);
      } finally {
        setHistoryLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
    } catch {}
  }, [historyLoaded, recentSearches]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const term = query.trim();
    if (!isOpen || term.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");
      setHasSearched(false);
      setResults({ users: [], posts: [] });
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 429) {
            const seconds = Math.max(1, Number(data.retryAfterSeconds) || 1);
            throw new Error(isEnglish
              ? `You’re searching quickly. Try again in ${seconds}s.`
              : `زۆر خێرا گەڕانت کردووە؛ دوای ${seconds} چرکە دووبارە هەوڵ بدەرەوە.`);
          }
          throw new Error(data.error || (isEnglish ? "Search is unavailable right now." : "گەڕان ئێستا بەردەست نییە."));
        }
        setResults({
          users: Array.isArray(data.users) ? data.users : [],
          posts: Array.isArray(data.posts) ? data.posts : [],
        });
        setSettledQuery(term);
        setHasSearched(true);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : (isEnglish ? "Search failed." : "گەڕان سەرکەوتوو نەبوو."));
        setResults({ users: [], posts: [] });
        setSettledQuery(term);
        setHasSearched(true);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, query, isEnglish, retryNonce]);

  const handleOpen = () => {
    setIsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  const rememberSearch = (term: string) => {
    const value = term.trim();
    if (!value) return;
    setRecentSearches((previous) => [value, ...previous.filter((entry) => entry !== value)].slice(0, MAX_RECENT_SEARCHES));
  };

  const selectUser = (user: SearchUser) => {
    rememberSearch(query);
    handleClose();
    onViewProfile?.(user.id);
  };

  const selectPost = (post: SearchPost) => {
    rememberSearch(query);
    handleClose();
    onOpenPost?.(post.id);
  };

  const moveResultFocus = (event: ReactKeyboardEvent<HTMLInputElement | HTMLButtonElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const options = dropdownRef.current?.querySelectorAll<HTMLButtonElement>("button[data-search-option]");
    if (!options?.length) return;
    event.preventDefault();
    const currentIndex = Array.from(options).indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.key === "ArrowDown"
      ? (currentIndex + 1 + options.length) % options.length
      : (currentIndex <= 0 ? options.length - 1 : currentIndex - 1);
    options[nextIndex]?.focus();
  };

  const currentTerm = query.trim();
  const isSearchPending = currentTerm.length >= MIN_QUERY_LENGTH && (isLoading || settledQuery !== currentTerm);
  const currentError = settledQuery === currentTerm ? error : "";

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || error) return;
    if (results.users[0]) selectUser(results.users[0]);
    else if (results.posts[0]) selectPost(results.posts[0]);
  };

  const removeRecent = (term: string) => setRecentSearches((previous) => previous.filter((item) => item !== term));

  return (
    <div ref={dropdownRef} className="relative z-[60] min-w-0">
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label={isEnglish ? "Search Pola" : "گەڕان لە پۆلا"}
          className={`group relative flex h-10 w-10 items-center rounded-full border border-border/80 bg-muted/40 transition-all duration-200 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-9 sm:w-44 md:w-64 lg:w-72 ${dir === "rtl" ? "sm:pr-9 sm:pl-3" : "sm:pl-9 sm:pr-3"}`}
        >
          <Search className={`absolute size-4 text-muted-foreground transition-colors group-hover:text-foreground ${dir === "rtl" ? "right-3.5" : "left-3.5"}`} />
          <span className={`hidden min-w-0 flex-1 truncate text-xs text-muted-foreground sm:block ${dir === "rtl" ? "text-right" : "text-left"}`}>
            {isEnglish ? "Search Pola…" : "گەڕان لە پۆلا..."}
          </span>
          <kbd className={`absolute hidden rounded border border-border/80 bg-background/70 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground lg:inline-flex ${dir === "rtl" ? "left-2" : "right-2"}`} dir="ltr">⌘K</kbd>
        </button>
      )}

      {isOpen && (
        <div className={`absolute top-0 z-[70] w-[min(25rem,calc(100vw-1.25rem))] rounded-2xl border border-border/80 bg-card p-2.5 text-card-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-98 duration-150 sm:p-3 ${dir === "rtl" ? "right-0 text-right" : "left-0 text-left"}`}>
          <form onSubmit={submitSearch} role="search">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={isEnglish ? "Close search" : "داخستنی گەڕان"}
              >
                <ArrowLeft className={`size-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </button>
              <div className="relative min-w-0 flex-1">
                <Search className={`pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ${dir === "rtl" ? "right-3" : "left-3"}`} />
                <input
                  ref={inputRef}
                  type="text"
                  role="searchbox"
                  aria-label={isEnglish ? "Search people and posts" : "گەڕان بەدوای کەس و پۆستدا"}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value.slice(0, 80));
                    setSettledQuery("");
                  }}
                  onKeyDown={moveResultFocus}
                  placeholder={isEnglish ? "People and posts…" : "گەڕان بەدوای کەس و پۆستدا..."}
                  className={`h-10 w-full rounded-full border border-border/70 bg-muted/50 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/15 ${dir === "rtl" ? "pr-9 pl-9 text-right" : "pl-9 pr-9 text-left"}`}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                    className={`absolute top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground ${dir === "rtl" ? "left-1.5" : "right-1.5"}`}
                    aria-label={isEnglish ? "Clear search" : "پاککردنەوەی گەڕان"}
                  ><X className="size-3.5" /></button>
                )}
              </div>
            </div>
          </form>

          <div id="pola-search-results" role="region" aria-live="polite" aria-label={isEnglish ? "Search results" : "ئەنجامەکانی گەڕان"} className="max-h-[min(65dvh,28rem)] space-y-2 overflow-y-auto overscroll-contain pt-2 [scrollbar-width:thin]">
            {query.trim().length < MIN_QUERY_LENGTH ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-bold">{isEnglish ? "Recent searches" : "گەڕانەکانی پێشوو"}</span>
                  {recentSearches.length > 0 && <button type="button" onClick={() => setRecentSearches([])} className="text-[11px] font-medium text-primary hover:underline">{isEnglish ? "Clear all" : "سڕینەوەی هەمووی"}</button>}
                </div>
                {recentSearches.length > 0 ? recentSearches.map((term) => (
                  <div key={term} className="group flex items-center gap-2 rounded-xl px-1.5 transition-colors hover:bg-muted/60">
                    <button type="button" onClick={() => { setSettledQuery(""); setQuery(term); }} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-start">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted/70 text-muted-foreground"><Clock className="size-4" /></span>
                      <span className="truncate text-sm">{term}</span>
                    </button>
                    <button type="button" onClick={() => removeRecent(term)} className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground opacity-70 hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100" aria-label={isEnglish ? `Remove ${term}` : `سڕینەوەی ${term}`}><X className="size-3.5" /></button>
                  </div>
                )) : (
                  <p className="px-2 py-5 text-center text-xs text-muted-foreground">{isEnglish ? "Search for a person or a post." : "بەدوای کەسێک یان پۆستێکدا بگەڕێ."}</p>
                )}
                {query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH && <p className="px-2 pb-2 text-[11px] text-muted-foreground">{isEnglish ? "Type at least 3 characters to search." : "بۆ گەڕان لانیکەم ٣ پیت بنووسە."}</p>}
              </div>
            ) : isSearchPending ? (
              <div className="space-y-2 p-1 py-2" aria-label={isEnglish ? "Searching" : "گەڕان دەکرێت"}>
                {[0, 1, 2, 3].map((item) => <div key={item} className="flex items-center gap-3 p-1"><Skeleton className="size-10 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-40" /></div></div>)}
              </div>
            ) : currentError ? (
              <div className="px-3 py-6 text-center" role="status">
                <p className="text-sm font-medium text-foreground">{currentError}</p>
                <button type="button" onClick={() => { setSettledQuery(""); setRetryNonce((value) => value + 1); }} className="mt-2 text-xs font-semibold text-primary hover:underline">{isEnglish ? "Try again" : "دووبارە هەوڵ بدەرەوە"}</button>
              </div>
            ) : hasSearched && results.users.length === 0 && results.posts.length === 0 ? (
              <div className="px-3 py-8 text-center" role="status">
                <SearchX className="mx-auto mb-2 size-7 text-muted-foreground/70" />
                <p className="text-sm font-semibold">{isEnglish ? "No results found" : "هیچ ئەنجامێک نەدۆزرایەوە"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{isEnglish ? "Try another name or a few words from the post." : "ناوێکی تر یان چەند وشەیەکی پۆستەکە تاقی بکەرەوە."}</p>
              </div>
            ) : (
              <>
                {results.users.length > 0 && (
                  <section role="group" aria-label={isEnglish ? "People" : "کەسەکان"}>
                    <h2 className="px-2 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{isEnglish ? "People" : "کەسەکان"}</h2>
                    {results.users.map((user) => (
                      <button key={user.id} type="button" data-search-option onKeyDown={moveResultFocus} onClick={() => selectUser(user)} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-1.5 text-start transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        {user.avatar ? <img src={user.avatar} alt="" loading="lazy" className="size-10 shrink-0 rounded-full border border-border/60 bg-muted object-cover" /> : <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><UserRound className="size-5" /></span>}
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{user.name}</span><span className="block truncate text-xs text-muted-foreground">{user.handle}{user.subtitle ? ` · ${user.subtitle}` : ""}</span></span>
                        <UserRound className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </section>
                )}
                {results.posts.length > 0 && (
                  <section role="group" aria-label={isEnglish ? "Posts" : "پۆستەکان"}>
                    <h2 className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{isEnglish ? "Posts" : "پۆستەکان"}</h2>
                    {results.posts.map((post) => (
                      <button key={post.id} type="button" data-search-option onKeyDown={moveResultFocus} onClick={() => selectPost(post)} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 text-start transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        {post.author.avatar ? <img src={post.author.avatar} alt="" loading="lazy" className="size-10 shrink-0 rounded-full border border-border/60 bg-muted object-cover" /> : <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><FileText className="size-4" /></span>}
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{post.author.name}</span><span className="block truncate text-xs text-muted-foreground">{post.content || (isEnglish ? "Photo post" : "پۆستی وێنە")}</span></span>
                        {post.mediaUrl && <img src={post.mediaUrl} alt="" loading="lazy" className="size-10 shrink-0 rounded-lg border border-border/60 bg-muted object-cover" />}
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
