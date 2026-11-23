import type { Metadata } from "next";
import { InstructorProfilePage } from "@/views/instructor";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your instructor profile.",
};

export default function Page() {
  return <InstructorProfilePage />;
}
