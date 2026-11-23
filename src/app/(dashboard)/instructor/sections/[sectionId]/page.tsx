import type { Metadata } from "next";
import { SectionManagePage } from "@/views/instructor";

export const metadata: Metadata = {
  title: "Manage Section",
  description: "Attendance, exams, and results for a section.",
};

export default function Page() {
  return <SectionManagePage />;
}
