import { requireRole } from "@/lib/server/api";

/** Server-side role check for the STUDENT area (middleware enforces it first). */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("STUDENT");
  return <>{children}</>;
}
