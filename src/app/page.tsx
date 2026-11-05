"use client";
// Root route — the only user-visible route.
//  - loading            -> spinner
//  - not authenticated  -> LandingPage (with a switch to the AuthView)
//  - authenticated      -> AppShell (the workspace)
import { useState } from "react";
import { AuthProvider, useAuth } from "@/context/auth";
import { AuthView } from "@/components/auth/auth-gate";
import { AppShell } from "@/components/app/app-shell";
import { LandingPage } from "@/components/landing/landing-page";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand";

type GuestView = "landing" | "auth";

function Root() {
  const { user, loading } = useAuth();
  const [guestView, setGuestView] = useState<GuestView>("landing");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <BrandLogo size="md" className="animate-pulse" />
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            <p className="text-sm">Loading Singhal FinRAG…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (guestView === "auth") {
      return <AuthView initialMode={authMode} onBackHome={() => setGuestView("landing")} />;
    }
    return (
      <LandingPage
        onSignIn={() => { setAuthMode("login"); setGuestView("auth"); }}
        onRegister={() => { setAuthMode("register"); setGuestView("auth"); }}
      />
    );
  }

  return <AppShell />;
}

export default function Page() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
