import type { Metadata } from "next";
import { TranscriptPage } from "@/views/student2";

export const metadata: Metadata = {
  title: "Transcript",
  description: "Your academic transcript with semester and cumulative GPA.",
};

export default function Page() {
  return <TranscriptPage />;
}
