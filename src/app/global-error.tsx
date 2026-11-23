"use client";

import { useEffect } from "react";
import "./globals.css";

/** Last-resort boundary: replaces the root layout when it fails. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[UMS] Fatal error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#faf9f6] px-4 text-center font-sans">
        <h1 className="text-2xl font-bold text-zinc-900">The application failed to load</h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          A critical error occurred. Please reload the page.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Reload
        </button>
      </body>
    </html>
  );
}
