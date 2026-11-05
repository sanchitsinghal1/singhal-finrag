"use client";
// ============================================================================
// Root Page — the single entry point (the only route users see is "/")
// ============================================================================
// This component decides what the visitor sees, based on auth state:
//
//   loading?          -> spinner (session is being restored from the cookie)
//   not logged in?    -> LandingPage (marketing) OR AuthView (login/register)
//   logged in?        -> AppShell (the workspace: dashboard, research, etc.)
//
// WHY ONE ROUTE:
//   The sandbox exposes only "/" to the browser. So instead of Next.js route
//   segments (/dashboard, /login, ...), we switch views with React state.
//   `guestView` toggles between the landing page and the auth form for
//   unauthenticated visitors. Once logged in, AppShell takes over and
//   manages its own tab state internally.
// ============================================================================
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/context/auth";
import { AuthView } from "@/components/auth/auth-gate";
import { AppShell } from "@/components/app/app-shell";
import { LandingPage } from "@/components/landing/landing-page";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand";

function Root() {
  const { user, loading } = useAuth();
  // For unauthenticated visitors: "landing" (marketing page) or "auth" (form)
  const [guestView, setGuestView] = useState("landing");
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

  if (loading) {
    return jsxDEV_7x81h0kn("div", {
      className: "min-h-screen grid place-items-center bg-background",
      children: jsxDEV_7x81h0kn("div", {
        className: "flex flex-col items-center gap-3 text-muted-foreground",
        children: [
          jsxDEV_7x81h0kn(BrandLogo, {
            size: "md",
            className: "animate-pulse"
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn("div", {
            className: "flex items-center gap-2",
            children: [
              jsxDEV_7x81h0kn(Loader2, {
                className: "h-4 w-4 animate-spin text-emerald-600"
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn("p", {
                className: "text-sm",
                children: "Loading Singhal FinRAG…"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
  }
  if (!user) {
    if (guestView === "auth") {
      return jsxDEV_7x81h0kn(AuthView, {
        initialMode: authMode,
        onBackHome: () => setGuestView("landing")
      }, undefined, false, undefined, this);
    }
    return jsxDEV_7x81h0kn(LandingPage, {
      onSignIn: () => {
        setAuthMode("login");
        setGuestView("auth");
      },
      onRegister: () => {
        setAuthMode("register");
        setGuestView("auth");
      }
    }, undefined, false, undefined, this);
  }
  return jsxDEV_7x81h0kn(AppShell, {}, undefined, false, undefined, this);
}
export default function Page() {
  return jsxDEV_7x81h0kn(AuthProvider, {
    children: jsxDEV_7x81h0kn(Root, {}, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}
