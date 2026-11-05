"use client";
// =====================================================================
// Auth context — lightweight global state for the current user.
// =====================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name?: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });

  const refresh = useCallback(async () => {
    try {
      const user = await api.get<AuthUser | null>("/api/auth/me");
      setState({ user, loading: false, error: null });
    } catch (err) {
      setState({ user: null, loading: false, error: (err as Error).message });
    }
  }, []);

  // Restore the session once on mount. The fetch is async so setState
  // happens after the await (not synchronously in the effect body), which
  // is the recommended pattern for "load on mount" effects.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await api.get<AuthUser | null>("/api/auth/me");
        if (active) setState({ user, loading: false, error: null });
      } catch (err) {
        if (active) setState({ user: null, loading: false, error: (err as Error).message });
      }
    })();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await api.post<AuthUser>("/api/auth/login", { email, password });
    setState({ user, loading: false, error: null });
    return user;
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const user = await api.post<AuthUser>("/api/auth/register", { email, password, name });
    setState({ user, loading: false, error: null });
    return user;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout", {});
    setState({ user: null, loading: false, error: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
