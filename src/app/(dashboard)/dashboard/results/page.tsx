import type { Metadata } from "next";
import { ResultsPage } from "@/views/student2";

export const metadata: Metadata = {
  title: "Results",
  description: "Your published exam results and grades.",
};

export default function Page() {
  return <ResultsPage />;
}
