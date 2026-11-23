import { Suspense } from "react";
import type { Metadata } from "next";
import { PageSkeleton } from "@/components/skeletons";
import { LoginView } from "@/views/auth";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to UMS — one-click demo login for Admin, Student, and Instructor.",
};

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton variant="auth" />}>
      <LoginView />
    </Suspense>
  );
}
