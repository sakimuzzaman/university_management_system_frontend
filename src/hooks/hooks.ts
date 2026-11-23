"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, courseApi, departmentApi, programApi, semesterApi, userApi } from "@/lib/services";
import type { ApiErrorShape, User } from "@/lib/types";

/** Debounce a value (e.g. search inputs). */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * URL search-param state. Uses the native History API, which Next.js syncs
 * with useSearchParams() — filters update the URL (bookmarkable/shareable)
 * without a server round-trip.
 */
export function useSearchParamsState(): [
  URLSearchParams,
  (next: URLSearchParams, opts?: { replace?: boolean }) => void,
] {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const setParams = useCallback(
    (next: URLSearchParams, opts?: { replace?: boolean }) => {
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts?.replace === false) window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [pathname],
  );

  return [params, setParams];
}

/** URL-synced pagination state (?page=2). */
export function usePagination() {
  const [searchParams, setSearchParams] = useSearchParamsState();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const setPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    setSearchParams(params, { replace: false });
  };
  return { page, setPage };
}

/** Normalize any thrown value into toast notifications. */
export function toastApiError(error: unknown, fallback = "Something went wrong") {
  const err = error as ApiErrorShape;
  const message = err?.message ?? fallback;
  toast.error(message);
  for (const e of err?.errors?.slice(0, 3) ?? []) {
    if (e.message && e.message !== message) toast.error(e.message);
  }
}

export function toastSuccess(message: string) {
  toast.success(message);
}

/** Current session for public pages (null when logged out). */
export function useSession() {
  return useQuery<User | null>({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await userApi.me();
      } catch (error) {
        if ((error as ApiErrorShape)?.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
    meta: { silent: true },
  });
}

/* ------------------------- Shared lookups -------------------------- */

export function useDepartments() {
  return useQuery({ queryKey: ["departments"], queryFn: () => departmentApi.list({ limit: 100 }) });
}

export function usePrograms(departmentId?: string) {
  return useQuery({
    queryKey: ["programs", departmentId ?? "all"],
    queryFn: () => programApi.list({ limit: 100, departmentId }),
  });
}

export function useSemesters(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["semesters", params ?? {}],
    queryFn: () => semesterApi.list({ limit: 100, ...params }),
  });
}

export function useCourses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["courses", params ?? {}],
    queryFn: () => courseApi.list({ limit: 100, ...params }),
  });
}

export interface InstructorOption {
  profileId: string;
  userId: string;
  name: string;
  employeeId: string;
  designation: string;
  departmentCode: string;
}

/** Instructors with resolved profile ids (for section assignment). */
export function useInstructors() {
  return useQuery({
    queryKey: ["instructors"],
    queryFn: async (): Promise<InstructorOption[]> => {
      const res = await adminApi.users({ role: "INSTRUCTOR", limit: 100 });
      const detailed = await Promise.all(
        res.users.map(async (u) => {
          if (u.instructorProfile?.id) return u;
          try {
            return await adminApi.user(u.id);
          } catch {
            return u;
          }
        }),
      );
      return detailed
        .filter((u) => u.instructorProfile?.id)
        .map((u) => ({
          profileId: u.instructorProfile!.id,
          userId: u.id,
          name: u.name,
          employeeId: u.instructorProfile!.employeeId,
          designation: u.instructorProfile!.designation,
          departmentCode: u.instructorProfile!.department.code,
        }));
    },
  });
}
