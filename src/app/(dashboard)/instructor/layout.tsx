import { requireRole } from "@/lib/server/api";

/** Server-side role check for the INSTRUCTOR area (middleware enforces it first). */
export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  await requireRole("INSTRUCTOR");
  return <>{children}</>;
}
