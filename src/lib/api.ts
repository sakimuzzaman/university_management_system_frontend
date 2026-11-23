
import type { ApiErrorShape } from "./types";

export interface RequestOptions {
  body?: unknown;
  params?: Record<string, unknown>;
}

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: ApiErrorShape["errors"];
}

export const UNAUTHORIZED_EVENT = "ums:unauthorized";

async function parse<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !json?.success) {
    const error: ApiErrorShape = {
      status: res.status,
      message:
        json?.message ??
        (res.status === 401 ? "Your session has expired. Please log in again." : "Request failed"),
      errors: json?.errors ?? [],
    };
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    throw error;
  }
  return json.data as T;
}

function networkError(): ApiErrorShape {
  return { status: 0, message: "Network error — please check your connection.", errors: [] };
}

export async function apiRequest<T>(method: string, path: string, opts?: RequestOptions): Promise<T> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(opts?.params ?? {})) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  }
  const query = qs.toString();
  const hasBody = opts?.body !== undefined;

  let res: Response;
  try {
    res = await fetch(`/api/proxy${path}${query ? `?${query}` : ""}`, {
      method,
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(opts?.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw networkError();
  }
  return parse<T>(res);
}

export type AuthAction = "login" | "register" | "logout";

export async function authRequest<T>(action: AuthAction, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/auth/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw networkError();
  }
  return parse<T>(res);
}
