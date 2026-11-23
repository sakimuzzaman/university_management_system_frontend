import type { Metadata } from "next";
import { AdminAcademicsPage } from "@/views/admin2";

export const metadata: Metadata = {
  title: "Academics",
  description: "Manage departments, programs, and the course catalog.",
};

export default function Page() {
  return <AdminAcademicsPage />;
}
