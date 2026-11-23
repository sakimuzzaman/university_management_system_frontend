import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf9f6] px-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
        <GraduationCap className="h-7 w-7" />
      </span>
      <p className="mt-6 font-display text-8xl font-bold tracking-tight text-emerald-700">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-zinc-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    </div>
  );
}
