import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { apiRequest } from "../api/client";
import { queryClient } from "../api/queryClient";
import {
  clearSession,
  getTokenExpiry,
  isSessionExpired,
  loadSession,
  saveSession,
} from "./session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());

  const logout = useCallback(() => {
    clearSession();
    queryClient.clear();
    setSession(null);
  }, []);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    if (isSessionExpired(session)) {
      logout();
      return undefined;
    }

    const timeoutId = window.setTimeout(logout, session.expiresAt - Date.now());
    return () => window.clearTimeout(timeoutId);
  }, [logout, session]);

  const login = useCallback(
    async ({ email, password }) => {
      const tokenResponse = await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      const token = tokenResponse.access_token;
      const user = await apiRequest("/auth/me", {
        token,
        onUnauthorized: logout,
      });
      const nextSession = {
        expiresAt: getTokenExpiry(token, tokenResponse.expires_in),
        token,
        tokenType: tokenResponse.token_type,
        user,
      };

      saveSession(nextSession);
      setSession(nextSession);
      return nextSession;
    },
    [logout],
  );

  const authorizedRequest = useCallback(
    (path, options = {}) => {
      if (!session || isSessionExpired(session)) {
        logout();
        return Promise.reject(new Error("Session expired"));
      }

      return apiRequest(path, {
        ...options,
        token: session.token,
        onUnauthorized: logout,
      });
    },
    [logout, session],
  );

  const value = useMemo(
    () => ({
      apiRequest: authorizedRequest,
      isAuthenticated: Boolean(session && !isSessionExpired(session)),
      login,
      logout,
      session,
      user: session?.user ?? null,
    }),
    [authorizedRequest, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
