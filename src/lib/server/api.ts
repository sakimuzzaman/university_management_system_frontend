/* ------------------------------------------------------------------ */
/*  Server-side data access for Server Components & layouts.          */
/* ------------------------------------------------------------------ */

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, API_URL } from "./tokens";
import { roleHome } from "../roles";
import type { Role, User } from "../types";

type Query = Record<string, string | number | undefined>;

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

function buildUrl(path: string, params?: Query): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const query = qs.toString();
  return `${API_URL}${path}${query ? `?${query}` : ""}`;
}

/**
 * Public, cacheable reads (Incremental Static Regeneration).
 * Returns null when the API is unreachable so pages degrade gracefully.
 */
export async function publicFetch<T>(path: string, params?: Query, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(buildUrl(path, params), { next: { revalidate } });
    if (!res.ok) return null;
    const json = (await res.json()) as Envelope<T>;
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export interface AuthFetchResult<T> {
  data: T | null;
  /** HTTP status, or 0 when the API could not be reached. */
  status: number;
}

/** Authenticated, uncached reads using the httpOnly access-token cookie. */
export async function authFetch<T>(path: string, params?: Query): Promise<AuthFetchResult<T>> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return { data: null, status: 401 };
  try {
    const res = await fetch(buildUrl(path, params), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as Envelope<T> | null;
    if (!res.ok || !json?.success) return { data: null, status: res.status };
    return { data: json.data, status: res.status };
  } catch {
    return { data: null, status: 0 };
  }
}

/** Current user, de-duplicated per request with React cache(). */
export const getSessionUser = cache(async (): Promise<User | null> => {
  const { data, status } = await authFetch<User>("/users/me");
  if (status === 0) {
    throw new Error("The UMS API is unreachable. Make sure the backend is running.");
  }
  return data;
});

/**
 * Defence in depth behind middleware: verifies the session with the API and
 * enforces the role for a route segment.
 */
export async function requireRole(role: Role): Promise<User> {
  const user = await getSessionUser();
  // Token was rejected by the API (expired/deactivated): clear cookies via the logout handler.
  if (!user) redirect("/api/auth/logout");
  if (user.role !== role) redirect(roleHome(user.role));
  return user;
}
