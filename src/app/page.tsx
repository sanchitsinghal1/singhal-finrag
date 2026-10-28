"use client";
// Root route — the only user-visible route. Renders the auth gate when
// the session is loading or the user is not signed in, otherwise the app.
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/context/auth";
import { AuthGate } from "@/components/auth/auth-gate";
import { AppShell } from "@/components/app/app-shell";
import { Loader2 } from "lucide-react";

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <p className="text-sm">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthGate />;
  return <AppShell />;
}

export default function Page() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
