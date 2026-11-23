import type { Metadata } from "next";
import { AttendancePage } from "@/views/student2";

export const metadata: Metadata = {
  title: "Attendance",
  description: "Your attendance records across all sections.",
};

export default function Page() {
  return <AttendancePage />;
}
