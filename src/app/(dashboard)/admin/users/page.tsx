import type { Metadata } from "next";
import { AdminUsersPage } from "@/views/admin";

export const metadata: Metadata = {
  title: "Users",
  description: "Manage accounts, roles, and activation status.",
};

export default function Page() {
  return <AdminUsersPage />;
}
