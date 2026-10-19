import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, configureApi, Module, normalizeBaseUrl } from '../api/client';

export type AccountType = 'admin' | 'employee' | 'partner';

export type Session = {
  accountType: AccountType;
  tokens: Partial<Record<Module, string>>;
  users: { oms?: any; partnership?: any; universal?: any };
};

type AuthState = {
  ready: boolean;
  session: Session | null;
  serverUrl: string;
  notice: string | null;
  signIn: (serverUrl: string, accountType: AccountType, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (module: Module, user: any) => void;
};

const SESSION_KEY = 'lbos.session';
const SERVER_KEY = 'lbos.serverUrl';

const AuthContext = createContext<AuthState | null>(null);

/** Each module's own sign-out route (the single sign-in has none). */
const LOGOUT_PATHS: Record<Module, string> = {
  oms: '/logout',
  partnership: '/v1/auth/logout',
  universal: '/admin/logout',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const clearLocal = useCallback(async (message: string | null) => {
    configureApi({ tokens: {} });
    setSession(null);
    setNotice(message);
    await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, []);

  useEffect(() => {
    configureApi({
      // A revoked or expired token: drop the session and ask for a new sign-in.
      onUnauthorized: () => {
        clearLocal('Your session has ended. Please sign in again.');
      },
    });

    (async () => {
      try {
        const [savedUrl, savedSession] = await Promise.all([
          AsyncStorage.getItem(SERVER_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);
        if (savedUrl) {
          setServerUrl(savedUrl);
          configureApi({ baseUrl: savedUrl });
        }
        if (savedUrl && savedSession) {
          const parsed: Session = JSON.parse(savedSession);
          configureApi({ tokens: parsed.tokens });
          setSession(parsed);
        }
      } catch {
        // Corrupt storage: start signed out.
      } finally {
        setReady(true);
      }
    })();
  }, [clearLocal]);

  const signIn = useCallback(async (rawUrl: string, accountType: AccountType, email: string, password: string) => {
    const baseUrl = normalizeBaseUrl(rawUrl);
    configureApi({ baseUrl, tokens: {} });

    const res = await api.post<{ account_type: AccountType; tokens: Session['tokens']; users: Session['users'] }>(
      null,
      '/auth/login',
      { account_type: accountType, email: email.trim(), password },
    );

    const next: Session = { accountType: res.account_type, tokens: res.tokens ?? {}, users: res.users ?? {} };
    configureApi({ tokens: next.tokens });
    await AsyncStorage.multiSet([
      [SERVER_KEY, baseUrl],
      [SESSION_KEY, JSON.stringify(next)],
    ]);
    setServerUrl(baseUrl);
    setNotice(null);
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    const tokens = session?.tokens ?? {};
    // Revoke every module token; ignore failures (offline, already revoked).
    await Promise.allSettled(
      (Object.keys(tokens) as Module[]).map(m => api.post(m, LOGOUT_PATHS[m])),
    );
    await clearLocal(null);
  }, [session, clearLocal]);

  const updateUser = useCallback((module: Module, user: any) => {
    setSession(prev => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev, users: { ...prev.users, [module]: { ...prev.users[module], ...user } } };
      AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ ready, session, serverUrl, notice, signIn, signOut, updateUser }),
    [ready, session, serverUrl, notice, signIn, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
