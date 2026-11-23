/* ------------------------------------------------------------------ */
/*  Skeleton loaders used by every loading.tsx (server-safe).         */
/* ------------------------------------------------------------------ */

import { Skeleton } from "./ui";

type Variant = "overview" | "table" | "cards" | "detail" | "form" | "public" | "auth";

function HeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

function StatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

function TableRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-10 flex-[2]" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="hidden h-10 flex-1 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ variant = "table" }: { variant?: Variant }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {variant === "overview" && (
        <>
          <HeaderSkeleton />
          <StatGrid count={8} />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
          <div className="mt-6">
            <TableRows rows={4} />
          </div>
        </>
      )}

      {variant === "table" && (
        <>
          <HeaderSkeleton />
          <Skeleton className="mb-4 h-16 w-full" />
          <TableRows />
        </>
      )}

      {variant === "cards" && (
        <>
          <HeaderSkeleton />
          <StatGrid />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        </>
      )}

      {variant === "detail" && (
        <>
          <HeaderSkeleton />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="mt-6 h-10 w-72" />
          <Skeleton className="mt-4 h-96" />
        </>
      )}

      {variant === "form" && (
        <>
          <HeaderSkeleton />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80" />
            <Skeleton className="h-80 lg:col-span-2" />
          </div>
        </>
      )}

      {variant === "public" && (
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-2/3 max-w-xl" />
          <Skeleton className="mt-4 h-5 w-1/2 max-w-md" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        </div>
      )}

      {variant === "auth" && (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <Skeleton className="h-[34rem] w-full max-w-md" />
        </div>
      )}
    </div>
  );
}
