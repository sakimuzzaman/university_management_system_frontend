import type { Metadata } from "next";
import { AdminAuditLogsPage } from "@/views/admin3";

export const metadata: Metadata = {
  title: "Audit Logs",
  description: "Every recorded action across the system.",
};

export default function Page() {
  return <AdminAuditLogsPage />;
}
