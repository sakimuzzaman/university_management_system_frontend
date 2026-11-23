import type { Metadata } from "next";
import { AdminSectionsPage } from "@/views/admin3";

export const metadata: Metadata = {
  title: "Sections",
  description: "Course sections offered per semester.",
};

export default function Page() {
  return <AdminSectionsPage />;
}
