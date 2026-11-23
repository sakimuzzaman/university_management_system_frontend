import type { Role } from "./types";

/**
 * Seeded accounts from the backend's prisma/seed.ts.
 * Used by the one-click "Demo Login" buttons — they authenticate against the
 * real API exactly like the manual login form.
 */
export const DEMO_ACCOUNTS: {
  role: Role;
  label: string;
  email: string;
  password: string;
  blurb: string;
}[] = [
  { role: "ADMIN", label: "Admin", email: "admin@ums.edu", password: "Admin@1234", blurb: "Full system control & analytics" },
  { role: "STUDENT", label: "Student", email: "student@ums.edu", password: "Student@1234", blurb: "Enroll, pay tuition & track grades" },
  { role: "INSTRUCTOR", label: "Instructor", email: "instructor@ums.edu", password: "Instructor@1234", blurb: "Attendance, exams & results" },
];
