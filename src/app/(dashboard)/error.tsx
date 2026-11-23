"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[UMS] Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-red-200 bg-white px-6 py-16 text-center">
      <div className="rounded-2xl bg-red-50 p-3">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="mt-4 font-display text-xl font-semibold text-zinc-900">This page couldn&apos;t be loaded</h1>
      <p className="mt-1 max-w-md text-sm text-zinc-500">
        The UMS API may be unreachable or returned an unexpected response. Please try again.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-zinc-400">Reference: {error.digest}</p>}
      <div className="mt-5 flex gap-2">
        <Button onClick={reset}>
          <RotateCcw /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to site</Link>
        </Button>
      </div>
    </div>
  );
}
