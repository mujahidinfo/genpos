import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_COOKIES,
  apiFetch,
  clearAuthCookies,
  setAuthCookies,
  setShopCookie,
  type AuthResponse,
} from "@/server/api";
import type { Workspace } from "@/server/api-types";

/**
 * Keeps the API session alive before any page or tRPC call runs:
 *  - refreshes the access token when its cookie has expired (refresh tokens
 *    rotate, so this must happen in one place, before rendering);
 *  - makes sure an active branch cookie is set once the user has a shop.
 * Changes are written to the request (so this render sees them) and to the
 * response (so the browser keeps them).
 */
export async function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get(AUTH_COOKIES.refresh)?.value;
  let accessToken = request.cookies.get(AUTH_COOKIES.access)?.value;
  if (!refreshToken) return NextResponse.next();

  // Collect cookie writes, then apply them to both request and response.
  const writes: { name: string; value: string | null; options?: Record<string, unknown> }[] = [];
  const writer = {
    set: (name: string, value: string, options: Record<string, unknown>) =>
      writes.push({ name, value, options }),
    delete: (name: string) => writes.push({ name, value: null }),
  };

  if (!accessToken) {
    try {
      const auth = await apiFetch<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: { refreshToken },
      });
      setAuthCookies(writer, auth);
      accessToken = auth.accessToken;
    } catch {
      // Refresh token rejected (expired, revoked or reused): sign out cleanly.
      clearAuthCookies(writer);
      accessToken = undefined;
    }
  }

  if (accessToken && !request.cookies.get(AUTH_COOKIES.shop)?.value) {
    try {
      const workspaces = await apiFetch<Workspace[]>("/businesses", { token: accessToken });
      const firstShop = workspaces[0]?.shops[0];
      if (firstShop) setShopCookie(writer, firstShop.id);
    } catch {
      // Non-fatal: pages fall back to onboarding / API auto-selection.
    }
  }

  if (writes.length === 0) return NextResponse.next();

  for (const w of writes) {
    if (w.value === null) request.cookies.delete(w.name);
    else request.cookies.set(w.name, w.value);
  }
  const response = NextResponse.next({ request: { headers: request.headers } });
  for (const w of writes) {
    if (w.value === null) response.cookies.delete(w.name);
    else response.cookies.set(w.name, w.value, w.options);
  }
  return response;
}

export const config = {
  // Everything except static assets and image optimisation.
  matcher: ["/((?!_next/static|_next/image|favicon|icons|landing|sw.js|offline.html|manifest).*)"],
};
