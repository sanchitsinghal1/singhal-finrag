"use client";
// ============================================================================
// Auth Context — global state for the logged-in user
// ============================================================================
// This wraps the whole app (see app/page.jsx) so any component can read the
// current user via `const { user } = useAuth()` without prop-drilling.
//
// WHAT IT DOES:
//   - On mount: calls GET /api/auth/me to restore the session from the
//     httpOnly cookie (so a page refresh keeps you logged in).
//   - login(email, password) / register(...) -> POST to the backend, which
//     sets the cookie; then we update local state.
//   - logout() -> POST /api/auth/logout, which clears the cookie.
//
// The cookie is httpOnly so JavaScript can't read it directly — we only know
// who the user is by asking the backend (/api/auth/me). That's why this
// context exists: to cache that answer so we don't ask on every render.
// ============================================================================
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true, error: null });

  // Re-fetch the current user from the backend (used after login/register/logout).
  const refresh = useCallback(async () => {
    try {
      const user = await api.get("/api/auth/me");
      setState({ user, loading: false, error: null });
    } catch (err) {
      setState({ user: null, loading: false, error: err.message });
    }
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await api.get("/api/auth/me");
        if (active)
          setState({ user, loading: false, error: null });
      } catch (err) {
        if (active)
          setState({ user: null, loading: false, error: err.message });
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const login = useCallback(async (email, password) => {
    const user = await api.post("/api/auth/login", { email, password });
    setState({ user, loading: false, error: null });
    return user;
  }, []);
  const register = useCallback(async (email, password, name) => {
    const user = await api.post("/api/auth/register", { email, password, name });
    setState({ user, loading: false, error: null });
    return user;
  }, []);
  const logout = useCallback(async () => {
    await api.post("/api/auth/logout", {});
    setState({ user: null, loading: false, error: null });
  }, []);
  return jsxDEV_7x81h0kn(AuthContext.Provider, {
    value: { ...state, login, register, logout, refresh },
    children
  }, undefined, false, undefined, this);
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
