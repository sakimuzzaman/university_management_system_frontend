import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  API_URL,
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/server/tokens";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ action: string }> };

const LOGIN_ACTIONS = new Set(["login", "register"]);

function fail(status: number, message: string) {
  return NextResponse.json({ success: false, message, errors: [] }, { status });
}

async function revokeSession(req: NextRequest) {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!access) return;
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
    body: JSON.stringify(refresh ? { refreshToken: refresh } : {}),
    cache: "no-store",
  }).catch(() => null);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { action } = await ctx.params;

  if (action === "logout") {
    await revokeSession(req);
    const res = NextResponse.json({ success: true, message: "Logged out", data: {} });
    clearAuthCookies(res);
    return res;
  }

  if (!LOGIN_ACTIONS.has(action)) return fail(404, "Not found");

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await req.text(),
      cache: "no-store",
    });
  } catch {
    return fail(503, "The UMS API is unreachable. Please make sure the backend is running.");
  }

  const json = (await upstream.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: { user: User; accessToken: string; refreshToken: string };
  } | null;

  if (!upstream.ok || !json?.success || !json.data) {
    return NextResponse.json(json ?? { success: false, message: "Authentication failed", errors: [] }, {
      status: upstream.status || 500,
    });
  }

  const { user, accessToken, refreshToken } = json.data;
  const res = NextResponse.json({ success: true, message: json.message, data: { user } });
  setAuthCookies(res, accessToken, refreshToken);
  return res;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { action } = await ctx.params;
  if (action !== "logout") return fail(404, "Not found");
  await revokeSession(req);
  const res = NextResponse.redirect(new URL("/login", req.url));
  clearAuthCookies(res);
  return res;
}
