import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import type { AuthResponse, AuthUser } from '@/api/types';
import {
  api,
  configureAuth,
  getRefreshToken,
  refreshSession,
  setTokens,
} from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { secureStorage } from '@/lib/secure-storage';

const REFRESH_TOKEN_KEY = 'genpos.refreshToken';
const USER_KEY = 'genpos.user';

type SessionState =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: AuthUser };

type SessionContextValue = SessionState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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

async function persist(res: AuthResponse) {
  await Promise.all([
    secureStorage.set(REFRESH_TOKEN_KEY, res.refreshToken),
    secureStorage.set(USER_KEY, JSON.stringify(res.user)),
  ]);
}

async function clearPersisted() {
  await Promise.all([secureStorage.remove(REFRESH_TOKEN_KEY), secureStorage.remove(USER_KEY)]);
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ status: 'loading', user: null });

  useEffect(() => {
    const endSession = () => {
      setTokens({ accessToken: null, refreshToken: null });
      void clearPersisted();
      queryClient.clear();
      setState({ status: 'signedOut', user: null });
    };

    configureAuth({
      // Refresh tokens rotate, so every refresh must be persisted or the next
      // cold start would present a dead token.
      onTokensRefreshed: (res) => {
        void persist(res);
        setState({ status: 'signedIn', user: res.user });
      },
      onSessionExpired: endSession,
    });

    // Restore a previous session on cold start.
    void (async () => {
      const [storedToken, storedUser] = await Promise.all([
        secureStorage.get(REFRESH_TOKEN_KEY),
        secureStorage.get(USER_KEY),
      ]);
      if (!storedToken) {
        setState({ status: 'signedOut', user: null });
        return;
      }

      setTokens({ accessToken: null, refreshToken: storedToken });
      try {
        const res = await refreshSession();
        if (!res) endSession();
        // On success onTokensRefreshed has already moved us to signedIn.
      } catch {
        // Offline: keep the user in with their cached profile. Requests will
        // retry the refresh once the network is back.
        const cached = storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
        if (cached) setState({ status: 'signedIn', user: cached });
        else endSession();
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    setTokens(res);
    await persist(res);
    setState({ status: 'signedIn', user: res.user });
  };

  const signOut = async () => {
    const refreshToken = getRefreshToken();
    setTokens({ accessToken: null, refreshToken: null });
    await clearPersisted();
    queryClient.clear();
    setState({ status: 'signedOut', user: null });
    // Best effort: revoke the refresh token server-side.
    if (refreshToken) {
      api('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }).catch(() => {});
    }
  };

  return <SessionContext value={{ ...state, signIn, signOut }}>{children}</SessionContext>;
}
