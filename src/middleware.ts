/* ------------------------------------------------------------------ */
/*  Route protection (Edge middleware).                               */
/*  - /admin/**      → ADMIN only                                     */
/*  - /dashboard/**  → STUDENT only                                   */
/*  - /instructor/** → INSTRUCTOR only                                */
/*  - /login, /register redirect authenticated users to their home    */
/*  - Refreshes expired access tokens before the page renders, so     */
/*    Server Components always receive a valid cookie.                */
/* ------------------------------------------------------------------ */

import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  decodeJwt,
  isTokenFresh,
  refreshTokens,
  setAuthCookies,
  type RefreshResult,
} from "@/lib/server/tokens";
import { ROLE_AREAS, roleHome } from "@/lib/roles";
import type { Role } from "@/lib/types";

const AUTH_PAGES = new Set(["/login", "/register"]);

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  let role: Role | null = access && isTokenFresh(access) ? (decodeJwt(access)?.role ?? null) : null;
  let refreshed: RefreshResult | null = null;
  let refreshFailed = false;

  if (!role && refresh) {
    refreshed = await refreshTokens(refresh);
    if (refreshed) role = decodeJwt(refreshed.accessToken)?.role ?? null;
    else refreshFailed = true;
  }

  const area = ROLE_AREAS.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
  let response: NextResponse;

  if (area && !role) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", `${pathname}${search}`);
    response = NextResponse.redirect(url);
  } else if (area && role && role !== area.role) {
    response = NextResponse.redirect(new URL(roleHome(role), req.url));
  } else if (role && AUTH_PAGES.has(pathname)) {
    response = NextResponse.redirect(new URL(roleHome(role), req.url));
  } else if (refreshed) {
    // Forward the fresh tokens to Server Components rendering this request.
    req.cookies.set(ACCESS_COOKIE, refreshed.accessToken);
    req.cookies.set(REFRESH_COOKIE, refreshed.refreshToken);
    response = NextResponse.next({ request: { headers: req.headers } });
  } else {
    response = NextResponse.next();
  }

  if (refreshed) setAuthCookies(response, refreshed.accessToken, refreshed.refreshToken);
  else if (refreshFailed || (access && !role && !refresh)) clearAuthCookies(response);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.[\\w]+$).*)"],
};
