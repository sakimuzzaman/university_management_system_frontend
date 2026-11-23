import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout";
import { getSessionUser } from "@/lib/server/api";

// Authenticated, per-user content — never statically cached.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Middleware already guarantees a token; this verifies it with the API.
  const user = await getSessionUser();
  if (!user) redirect("/api/auth/logout");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
