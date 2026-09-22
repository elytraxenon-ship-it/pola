"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPost } from "@/components/feed/skeleton-post";

export function ProfileSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto pb-16 px-2 sm:px-4 text-right animate-pulse">
      {/* Cover Photo Skeleton */}
      <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-border/60 bg-muted/60 h-48 sm:h-64 md:h-80">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      {/* Profile Header Details & Avatar */}
      <div className="relative px-4 md:px-8 pb-4">
        {/* Top Action Row: Floating Avatar + Action Buttons */}
        <div className="flex items-end justify-between gap-4">
          {/* Avatar Skeleton */}
          <div className="-mt-16 sm:-mt-20 relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-full bg-background p-1.5 ring-4 ring-background shadow-xl">
            <Skeleton className="w-full h-full rounded-full" />
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex items-center gap-2 pt-3 shrink-0">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>

        {/* User Identifiers Skeleton */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <span className="text-muted-foreground/40">·</span>
            <Skeleton className="h-4 w-24 rounded-md" />
            <span className="text-muted-foreground/40">·</span>
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
        </div>

        {/* Bio & Meta Skeleton */}
        <div className="mt-4 max-w-2xl space-y-2">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />

          {/* Meta Info (Location, Date, Link) */}
          <div className="mt-3 flex flex-wrap items-center gap-4 pt-1">
            <Skeleton className="h-3.5 w-32 rounded-md" />
            <Skeleton className="h-3.5 w-36 rounded-md" />
            <Skeleton className="h-3.5 w-28 rounded-md" />
          </div>

          {/* Followers / Following Stats */}
          <div className="mt-4 flex items-center gap-6 pt-3 border-t border-border/40">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-10 rounded-md" />
              <Skeleton className="h-3.5 w-16 rounded-md" />
            </div>
            <span className="h-3 w-px bg-border/80" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-12 rounded-md" />
              <Skeleton className="h-3.5 w-18 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center border-b border-border/70 mb-5 px-4 gap-6 pt-2">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* Main Grid: Left sidebar + Right Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-4/5 rounded-md" />
            <div className="border-t border-border/50 pt-3 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="h-3.5 w-24 rounded-md" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-18 rounded-md" />
                <Skeleton className="h-3.5 w-20 rounded-md" />
              </div>
            </div>
          </div>

          {/* Featured Photos Skeleton */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Feed Posts) */}
        <div className="lg:col-span-2 space-y-4">
          <SkeletonPost />
          <SkeletonPost />
        </div>
      </div>
    </div>
  );
}
