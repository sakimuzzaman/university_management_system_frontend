/* ------------------------------------------------------------------ */
/*  Token + cookie helpers shared by middleware (Edge runtime) and    */
/*  Route Handlers (Node runtime). No Node-only APIs allowed here.    */
/* ------------------------------------------------------------------ */

import type { NextResponse } from "next/server";
import { isRole } from "../roles";
import type { Role, User } from "../types";

// export const API_URL = (
//   process.env.API_URL ??
//   process.env.NEXT_PUBLIC_API_URL ??
//   "https://university-management-system-backen-chi.vercel.app/"
// ).replace(/\/$/, "");

const configuredApiUrl = process.env.API_URL;

if (!configuredApiUrl) {
  throw new Error(
    "Missing API_URL environment variable. Please configure it in .env.local."
  );
}

export const API_URL = configuredApiUrl.replace(/\/+$/, "");

export const ACCESS_COOKIE = "ums_at";
export const REFRESH_COOKIE = "ums_rt";

const REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // matches backend JWT_REFRESH_EXPIRES_IN default (7d)
const secure = process.env.NODE_ENV === "production";

export interface AccessPayload {
  sub: string;
  email: string;
  role: Role;
  exp: number;
}

/** Decode (not verify) a JWT payload. Verification happens on the API. */
export function decodeJwt(token: string): AccessPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as Partial<AccessPayload>;
    if (!payload.sub || !isRole(payload.role) || typeof payload.exp !== "number") return null;
    return payload as AccessPayload;
  } catch {
    return null;
  }
}

export function isTokenFresh(token: string, skewMs = 30_000): boolean {
  const payload = decodeJwt(token);
  return !!payload && payload.exp * 1000 > Date.now() + skewMs;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/*
 * The backend rotates refresh tokens and revokes ALL sessions on reuse.
 * Parallel requests that refresh with the same token must therefore share a
 * single upstream call — results are memoised per token for a short window.
 */
const inflight = new Map<string, { at: number; promise: Promise<RefreshResult | null> }>();

export function refreshTokens(refreshToken: string): Promise<RefreshResult | null> {
  const now = Date.now();
  for (const [key, entry] of inflight) {
    if (now - entry.at > 60_000) inflight.delete(key);
  }
  const cached = inflight.get(refreshToken);
  if (cached && now - cached.at < 20_000) return cached.promise;

  const promise = (async (): Promise<RefreshResult | null> => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { data?: Partial<RefreshResult> };
      const data = json.data;
      if (!data?.accessToken || !data.refreshToken || !data.user) return null;
      return { accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user };
    } catch {
      return null;
    }
  })();

  inflight.set(refreshToken, { at: now, promise });
  return promise;
}

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string) {
  const exp = decodeJwt(accessToken)?.exp;
  const accessMaxAge = exp ? Math.max(30, exp - Math.floor(Date.now() / 1000)) : 15 * 60;
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
}
