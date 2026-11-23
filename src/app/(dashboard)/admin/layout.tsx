import { requireRole } from "@/lib/server/api";

/** Server-side role check for the ADMIN area (middleware enforces it first). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");
  return <>{children}</>;
}
