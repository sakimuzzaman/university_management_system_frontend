import { Suspense } from "react";
import type { Metadata } from "next";
import { PageSkeleton } from "@/components/skeletons";
import { PaymentSuccessView } from "@/views/payment";

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Stripe tuition payment confirmation.",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton variant="auth" />}>
      <PaymentSuccessView />
    </Suspense>
  );
}
