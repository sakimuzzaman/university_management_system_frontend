"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[UMS] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf9f6] px-4 text-center">
      <div className="rounded-2xl bg-red-50 p-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-zinc-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        An unexpected error occurred. Please try again — if the problem persists, contact the registrar's office.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-zinc-400">Reference: {error.digest}</p>}
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>
          <RotateCcw /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
