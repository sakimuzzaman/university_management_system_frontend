import { Suspense } from "react";
import type { Metadata } from "next";
import { PageSkeleton } from "@/components/skeletons";
import { RegisterView } from "@/views/auth";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a UMS student account in three quick steps.",
};

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton variant="auth" />}>
      <RegisterView />
    </Suspense>
  );
}
