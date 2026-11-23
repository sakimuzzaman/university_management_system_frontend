import type { Metadata } from "next";
import { ProfilePage } from "@/views/student2";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your personal information and student profile.",
};

export default function Page() {
  return <ProfilePage />;
}
