import type { Metadata } from "next";
import { BrowsePage } from "@/views/student";

export const metadata: Metadata = {
  title: "Browse Courses",
  description: "Find sections and enroll for the semester.",
};

export default function Page() {
  return <BrowsePage />;
}
