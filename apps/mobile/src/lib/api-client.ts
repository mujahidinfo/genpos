import type { AuthResponse } from '@/api/types';
import { API_URL } from '@/lib/config';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Send the access token and retry once after refreshing on 401. Default true. */
  auth?: boolean;
};

// ─── Token state ─────────────────────────────────────────────────────────────
// Access token lives only in memory. The refresh token is persisted by the
// session layer, which registers itself via `configureAuth`.

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshInFlight: Promise<AuthResponse | null> | null = null;

let handlers: {
  onTokensRefreshed: (res: AuthResponse) => void;
  onSessionExpired: () => void;
} = { onTokensRefreshed: () => {}, onSessionExpired: () => {} };

export function configureAuth(next: typeof handlers) {
  handlers = next;
}

export function setTokens(tokens: { accessToken: string | null; refreshToken: string | null }) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
}

export const getRefreshToken = () => refreshToken;

// The branch every tenant-scoped request acts on (sent as X-Shop-Id).
let shopId: string | null = null;

export function setActiveShopId(id: string | null) {
  shopId = id;
}

/**
 * Exchange the refresh token for a new pair. Refresh tokens are single-use on the
 * server, so concurrent callers must share one in-flight request — otherwise the
 * second request would present an already-rotated token and log the user out.
 *
 * Resolves null when the server rejects the token (session is over); throws on
 * network errors so callers can tell "offline" from "signed out".
 */
export function refreshSession(): Promise<AuthResponse | null> {
  if (!refreshToken) return Promise.resolve(null);
  refreshInFlight ??= (async () => {
    try {
      const res = await request<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        auth: false,
      });
      setTokens(res);
      handlers.onTokensRefreshed(res);
      return res;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setTokens({ accessToken: null, refreshToken: null });
        return null;
      }
      throw error;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// ─── Requests ────────────────────────────────────────────────────────────────

function buildUrl(path: string, query?: RequestOptions['query']) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
  }
  const qs = params.toString();
  return `${API_URL}${path}${qs ? `?${qs}` : ''}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options;
  const isFormData = body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: 'application/json',
        // FormData sets its own multipart boundary header.
        ...(body !== undefined && !isFormData && { 'Content-Type': 'application/json' }),
        ...(auth && accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...(auth && shopId && { 'X-Shop-Id': shopId }),
      },
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (cause) {
    throw new ApiError(0, `Can't reach the server at ${API_URL}`, cause);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const serverMessage =
      data && typeof data === 'object' && 'message' in data ? String(data.message) : '';
    const message = serverMessage || res.statusText || 'Request failed';
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Authenticated API call with transparent access-token refresh. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (options.auth === false) return request<T>(path, options);

  // No access token yet (e.g. cold start) but a refresh token is available.
  if (!accessToken && refreshToken && !(await refreshSession())) {
    handlers.onSessionExpired();
    throw new ApiError(401, 'Session expired');
  }

  try {
    return await request<T>(path, options);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !refreshToken) throw error;

    const refreshed = await refreshSession();
    if (!refreshed) {
      handlers.onSessionExpired();
      throw error;
    }
    return request<T>(path, options);
  }
}
