"use client";

export function HomeLoadingSkeleton({ dir }: { dir: "ltr" | "rtl" }) {
  return (
    <div dir={dir} aria-label={dir === "rtl" ? "پڕۆفایل باردەکرێت" : "Loading your profile"} aria-busy="true" className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 h-16 border-b border-border/60 bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="size-9 animate-pulse rounded-xl bg-muted" />
            <div className="hidden h-9 w-52 animate-pulse rounded-full bg-muted sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <div className="size-9 animate-pulse rounded-full bg-muted" />
            <div className="size-9 animate-pulse rounded-full bg-muted" />
            <div className="size-9 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-5 px-3 py-5 sm:px-5 lg:grid-cols-[240px_minmax(0,640px)]">
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="size-12 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="mt-5 h-2.5 w-full animate-pulse rounded bg-muted" />
            <div className="mt-3 h-2.5 w-4/5 animate-pulse rounded bg-muted" />
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            {["w-4/5", "w-3/5", "w-4/5", "w-2/3"].map((width, index) => (
              <div key={index} className={`mb-4 h-3 animate-pulse rounded bg-muted last:mb-0 ${width}`} />
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 animate-pulse rounded-full bg-muted" />
              <div className="h-10 flex-1 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
          {[0, 1, 2].map((item) => (
            <article key={item} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 animate-pulse rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              </div>
              {item === 0 && <div className="mt-4 aspect-[16/7] animate-pulse rounded-xl bg-muted" />}
              <div className="mt-5 flex gap-5 border-t border-border/50 pt-4">
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              </div>
            </article>
          ))}
        </main>
      </div>
    </div>
  );
}
