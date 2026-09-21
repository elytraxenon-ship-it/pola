"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonPost() {
  return (
    <div className="w-full rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>

      {/* Content Lines */}
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>

      {/* Media Placeholder */}
      <Skeleton className="h-56 w-full rounded-xl" />

      {/* Stats row */}
      <div className="flex justify-between border-b border-border/50 pb-2 pt-1">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2.5 w-24" />
      </div>

      {/* Action buttons row */}
      <div className="flex items-center justify-around pt-1">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}
