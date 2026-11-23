import type { Metadata } from "next";
import { StudentDashboardPage } from "@/views/student";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your enrollments, attendance, GPA, and upcoming exams.",
};

export default function Page() {
  return <StudentDashboardPage />;
}
