
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  API_URL,
  REFRESH_COOKIE,
  clearAuthCookies,
  isTokenFresh,
  refreshTokens,
  setAuthCookies,
  type RefreshResult,
} from "@/lib/server/tokens";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

function forward(req: NextRequest, url: string, body: string | undefined, token: string | undefined) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;
  return fetch(url, { method: req.method, headers, body, cache: "no-store" });
}

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;

  // Auth endpoints must go through /api/auth so tokens stay in httpOnly cookies.
  if (path[0] === "auth") {
    return NextResponse.json({ success: false, message: "Not found", errors: [] }, { status: 404 });
  }

  const url = `${API_URL}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : (await req.text()) || undefined;

  let access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  let refreshed: RefreshResult | null = null;
  let refreshFailed = false;

  if ((!access || !isTokenFresh(access)) && refresh) {
    refreshed = await refreshTokens(refresh);
    if (refreshed) access = refreshed.accessToken;
    else refreshFailed = true;
  }

  let upstream: Response;
  try {
    upstream = await forward(req, url, body, access);
    if (upstream.status === 401 && refresh && !refreshed && !refreshFailed) {
      refreshed = await refreshTokens(refresh);
      if (refreshed) upstream = await forward(req, url, body, refreshed.accessToken);
      else refreshFailed = true;
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "The UMS API is unreachable. Please try again shortly.", errors: [] },
      { status: 503 },
    );
  }

  const text = await upstream.text();
  const res = new NextResponse(text || null, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });

  if (refreshed) setAuthCookies(res, refreshed.accessToken, refreshed.refreshToken);
  else if (refreshFailed) clearAuthCookies(res);
  return res;
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
