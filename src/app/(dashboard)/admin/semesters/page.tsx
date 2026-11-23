import type { Metadata } from "next";
import { AdminSemestersPage } from "@/views/admin3";

export const metadata: Metadata = {
  title: "Semesters",
  description: "Manage the academic calendar and its lifecycle.",
};

export default function Page() {
  return <AdminSemestersPage />;
}
