import type { Role } from "./types";

/** Route areas protected by middleware, each owned by exactly one role. */
export const ROLE_AREAS: { prefix: string; role: Role }[] = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/dashboard", role: "STUDENT" },
  { prefix: "/instructor", role: "INSTRUCTOR" },
];

export function roleHome(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "INSTRUCTOR":
      return "/instructor";
    case "STUDENT":
      return "/dashboard";
  }
}

export function isRole(value: unknown): value is Role {
  return value === "ADMIN" || value === "INSTRUCTOR" || value === "STUDENT";
}
