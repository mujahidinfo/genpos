import "server-only";

/**
 * Server-side client for the GenPOS REST API (apps/api).
 *
 * The browser never sees API tokens: they live in httpOnly cookies, and every
 * call goes through Next (tRPC procedures, server components or `proxy.ts`).
 */

export const API_URL = (process.env.API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

export const AUTH_COOKIES = {
  access: "genpos_at",
  refresh: "genpos_rt",
  /** Active branch, sent to the API as X-Shop-Id. */
  shop: "genpos_shop",
} as const;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
};

type Query = Record<string, string | number | boolean | Date | undefined | null>;

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  token?: string | null;
  shopId?: string | null;
};

// The API sends dates as ISO strings; components (and superjson) expect Dates.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const reviveDates = (_key: string, value: unknown) =>
  typeof value === "string" && ISO_DATE.test(value) ? new Date(value) : value;

function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, value instanceof Date ? value.toISOString() : String(value));
  }
  const qs = params.toString();
  return `${API_URL}${path}${qs ? `?${qs}` : ""}`;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, query, token, shopId } = options;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(shopId && { "X-Shop-Id": shopId }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(503, "Can't reach the GenPOS server. Try again in a moment.");
  }

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text, reviveDates) : null;

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? Array.isArray(data.message)
          ? data.message.join(", ")
          : String(data.message)
        : res.statusText;
    throw new ApiError(res.status, message || "Request failed");
  }
  return data as T;
}

/** Minimal cookie writer shared by route handlers (`cookies()`) and proxy responses. */
type CookieWriter = {
  set: (name: string, value: string, options: Record<string, unknown>) => unknown;
  delete: (name: string) => unknown;
};

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setAuthCookies(cookies: CookieWriter, auth: AuthResponse) {
  // Expire the access cookie a little early so it is refreshed before the JWT lapses.
  const accessExpires = new Date(new Date(auth.accessTokenExpiresAt).getTime() - 30_000);
  cookies.set(AUTH_COOKIES.access, auth.accessToken, { ...baseCookie, expires: accessExpires });
  cookies.set(AUTH_COOKIES.refresh, auth.refreshToken, {
    ...baseCookie,
    expires: new Date(auth.refreshTokenExpiresAt),
  });
}

export function setShopCookie(cookies: CookieWriter, shopId: string) {
  cookies.set(AUTH_COOKIES.shop, shopId, { ...baseCookie, maxAge: 60 * 60 * 24 * 365 });
}

export function clearAuthCookies(cookies: CookieWriter) {
  for (const name of Object.values(AUTH_COOKIES)) cookies.delete(name);
}
