import { Suspense } from "react";
import type { Metadata } from "next";
import { PageSkeleton } from "@/components/skeletons";
import { PaymentCancelView } from "@/views/payment";

export const metadata: Metadata = {
  title: "Payment Canceled",
  description: "Stripe tuition payment was canceled.",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton variant="auth" />}>
      <PaymentCancelView />
    </Suspense>
  );
}
