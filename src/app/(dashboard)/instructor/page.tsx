import type { Metadata } from "next";
import { InstructorDashboardPage } from "@/views/instructor";

export const metadata: Metadata = {
  title: "My Sections",
  description: "Sections assigned to you this term.",
};

export default function Page() {
  return <InstructorDashboardPage />;
}
