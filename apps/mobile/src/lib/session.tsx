import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import type { AuthResponse, AuthUser, Role, Workspace } from '@/api/types';
import {
  api,
  configureAuth,
  getRefreshToken,
  refreshSession,
  setActiveShopId,
  setTokens,
} from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { secureStorage } from '@/lib/secure-storage';

const KEYS = {
  refreshToken: 'genpos.refreshToken',
  user: 'genpos.user',
  workspaces: 'genpos.workspaces',
  shopId: 'genpos.shopId',
} as const;

/** The branch the app is working in, with what the UI needs about it. */
export type ActiveShop = {
  id: string;
  name: string;
  businessId: string;
  businessName: string;
  role: Role;
};

/**
 *  loading   → restoring a saved session (splash stays up)
 *  signedOut → sign-in / sign-up screens
 *  needsShop → signed in but no business yet → onboarding
 *  ready     → the app
 */
type Status = 'loading' | 'signedOut' | 'needsShop' | 'ready';

type State = {
  status: Status;
  user: AuthUser | null;
  workspaces: Workspace[];
  activeShop: ActiveShop | null;
};

export type CreateBusinessInput = {
  name: string;
  phone?: string;
  currency: string;
};

type SessionContextValue = State & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  createBusiness: (input: CreateBusinessInput) => Promise<void>;
  switchShop: (shopId: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}

/** The signed-in user. Only call from screens behind the auth guard. */
export function useCurrentUser(): AuthUser {
  const { user } = useSession();
  if (!user) throw new Error('useCurrentUser called while signed out');
  return user;
}

/** The active branch. Only call from screens inside the app (status 'ready'). */
export function useActiveShop(): ActiveShop {
  const { activeShop } = useSession();
  if (!activeShop) throw new Error('useActiveShop called without an active shop');
  return activeShop;
}

/** Pick the remembered branch if it's still accessible, else the first one. */
function resolveShop(workspaces: Workspace[], preferredId: string | null): ActiveShop | null {
  const all = workspaces.flatMap((w) =>
    w.shops.map((s) => ({
      id: s.id,
      name: s.name,
      businessId: w.id,
      businessName: w.name,
      role: w.role,
    })),
  );
  return all.find((s) => s.id === preferredId) ?? all[0] ?? null;
}

const signedOut: State = { status: 'signedOut', user: null, workspaces: [], activeShop: null };

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<State>({ ...signedOut, status: 'loading' });

  /** Apply a user + their businesses, choosing the active branch. */
  const enter = (user: AuthUser, workspaces: Workspace[], preferredShopId: string | null) => {
    const activeShop = resolveShop(workspaces, preferredShopId);
    setActiveShopId(activeShop?.id ?? null);
    void secureStorage.set(KEYS.workspaces, JSON.stringify(workspaces));
    if (activeShop) void secureStorage.set(KEYS.shopId, activeShop.id);
    setState({ status: activeShop ? 'ready' : 'needsShop', user, workspaces, activeShop });
  };

  const persistAuth = (res: AuthResponse) =>
    Promise.all([
      secureStorage.set(KEYS.refreshToken, res.refreshToken),
      secureStorage.set(KEYS.user, JSON.stringify(res.user)),
    ]);

  const clearPersisted = () =>
    Promise.all(Object.values(KEYS).map((key) => secureStorage.remove(key)));

  const fetchWorkspaces = () => api<Workspace[]>('/businesses');

  useEffect(() => {
    const endSession = () => {
      setTokens({ accessToken: null, refreshToken: null });
      setActiveShopId(null);
      void clearPersisted();
      queryClient.clear();
      setState(signedOut);
    };

    configureAuth({
      // Refresh tokens rotate, so every refresh must be persisted or the next
      // cold start would present a dead token.
      onTokensRefreshed: (res) => {
        void persistAuth(res);
        setState((s) => (s.user ? { ...s, user: res.user } : s));
      },
      onSessionExpired: endSession,
    });

    // Restore a previous session on cold start.
    void (async () => {
      const [token, storedUser, storedWorkspaces, storedShopId] = await Promise.all([
        secureStorage.get(KEYS.refreshToken),
        secureStorage.get(KEYS.user),
        secureStorage.get(KEYS.workspaces),
        secureStorage.get(KEYS.shopId),
      ]);
      if (!token) {
        setState(signedOut);
        return;
      }

      setTokens({ accessToken: null, refreshToken: token });
      setActiveShopId(storedShopId);
      try {
        const res = await refreshSession();
        if (!res) return endSession();
        enter(res.user, await fetchWorkspaces(), storedShopId);
      } catch {
        // Offline: keep the user in with their cached profile and shops so the
        // counter keeps working; requests retry the refresh when back online.
        const user = storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
        const workspaces = storedWorkspaces ? (JSON.parse(storedWorkspaces) as Workspace[]) : [];
        if (user) enter(user, workspaces, storedShopId);
        else endSession();
      }
    })();
  }, []);

  const startSession = async (res: AuthResponse) => {
    setTokens(res);
    await persistAuth(res);
    const storedShopId = await secureStorage.get(KEYS.shopId);
    enter(res.user, await fetchWorkspaces(), storedShopId);
  };

  const value: SessionContextValue = {
    ...state,

    signIn: async (email, password) =>
      startSession(
        await api<AuthResponse>('/auth/login', {
          method: 'POST',
          body: { email, password },
          auth: false,
        }),
      ),

    signUp: async (name, email, password) =>
      startSession(
        await api<AuthResponse>('/auth/register', {
          method: 'POST',
          body: { name, email, password },
          auth: false,
        }),
      ),

    signInWithGoogle: async (idToken) =>
      startSession(
        await api<AuthResponse>('/auth/google', {
          method: 'POST',
          body: { idToken },
          auth: false,
        }),
      ),

    signOut: async () => {
      const refreshToken = getRefreshToken();
      setTokens({ accessToken: null, refreshToken: null });
      setActiveShopId(null);
      await clearPersisted();
      queryClient.clear();
      setState(signedOut);
      // Best effort: revoke the refresh token server-side.
      if (refreshToken) {
        api('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }).catch(() => {});
      }
    },

    createBusiness: async (input) => {
      const created = await api<Workspace>('/businesses', {
        method: 'POST',
        body: input,
      });
      enter(state.user!, await fetchWorkspaces(), created.shops[0]?.id ?? null);
    },

    switchShop: async (shopId) => {
      // Cached data belongs to the previous branch.
      queryClient.clear();
      enter(state.user!, state.workspaces, shopId);
    },

    refreshWorkspaces: async () => {
      enter(state.user!, await fetchWorkspaces(), state.activeShop?.id ?? null);
    },
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}
