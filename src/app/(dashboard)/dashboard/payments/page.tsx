import type { Metadata } from "next";
import { PaymentsPage } from "@/views/student";

export const metadata: Metadata = {
  title: "Tuition Payments",
  description: "Pay semester tuition with Stripe and view payment history.",
};

export default function Page() {
  return <PaymentsPage />;
}
